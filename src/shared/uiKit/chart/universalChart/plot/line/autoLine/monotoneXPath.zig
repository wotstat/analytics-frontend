const std = @import("std");

// [BUILD]
// zig build-exe monotoneXPath.zig -target wasm32-freestanding -fno-entry -rdynamic -O ReleaseSmall

const allocator = std.heap.wasm_allocator;

var empty_bytes: [0]u8 = .{};
var result_buffer: []u8 = empty_bytes[0..];
var result_length: usize = 0;

const NUMBER_CAPACITY = 24;
const MOVE_CAPACITY = 2 + NUMBER_CAPACITY + 1 + NUMBER_CAPACITY;
const SEGMENT_CAPACITY = 2 + NUMBER_CAPACITY + 1 + NUMBER_CAPACITY + 2 + NUMBER_CAPACITY + 1 + NUMBER_CAPACITY + 2 + NUMBER_CAPACITY + 1 + NUMBER_CAPACITY + 1;

const PathWriter = struct {
    buffer: []u8,
    pos: usize,

    fn init(capacity: usize) !PathWriter {
        if (result_buffer.len == 0) {
            result_buffer = try allocator.alloc(u8, capacity);
        } else if (result_buffer.len < capacity) {
            result_buffer = try allocator.realloc(result_buffer, capacity);
        }

        return .{
            .buffer = result_buffer,
            .pos = 0,
        };
    }

    fn deinit(self: *PathWriter) void {
        if (self.buffer.len > 0) {
            allocator.free(self.buffer);
        }

        result_buffer = empty_bytes[0..];
        result_length = 0;

        self.buffer = empty_bytes[0..];
        self.pos = 0;
    }

    fn finish(self: *PathWriter) void {
        result_buffer = self.buffer;
        result_length = self.pos;
    }

    fn ensure(self: *PathWriter, extra: usize) !void {
        if (self.pos + extra <= self.buffer.len) return;

        var next_len = @max(self.buffer.len * 2, self.pos + extra);
        if (next_len == 0) next_len = extra;

        self.buffer = try allocator.realloc(self.buffer, next_len);
        result_buffer = self.buffer;
    }

    fn byte(self: *PathWriter, value: u8) void {
        self.buffer[self.pos] = value;
        self.pos += 1;
    }

    fn text(self: *PathWriter, value: []const u8) void {
        @memcpy(self.buffer[self.pos .. self.pos + value.len], value);
        self.pos += value.len;
    }

    fn uint(self: *PathWriter, value: u64) void {
        if (value == 0) {
            self.byte('0');
            return;
        }

        var digits: [20]u8 = undefined;
        var count: usize = 0;
        var current = value;

        while (current > 0) {
            digits[count] = '0' + @as(u8, @intCast(current % 10));
            current /= 10;
            count += 1;
        }

        while (count > 0) {
            count -= 1;
            self.byte(digits[count]);
        }
    }

    fn number2(self: *PathWriter, value: f64) !void {
        if (!std.math.isFinite(value)) return error.InvalidNumber;

        const scaled_float = @floor(value * 100.0 + 0.5);
        const max_i64: f64 = @floatFromInt(std.math.maxInt(i64));
        const min_i64: f64 = @floatFromInt(std.math.minInt(i64));

        if (scaled_float > max_i64 or scaled_float < min_i64) {
            return error.InvalidNumber;
        }

        const scaled: i64 = @intFromFloat(scaled_float);

        if (scaled == 0) {
            self.byte('0');
            return;
        }

        var abs_scaled: u64 = undefined;

        if (scaled < 0) {
            self.byte('-');
            abs_scaled = @as(u64, @intCast(-(scaled + 1))) + 1;
        } else {
            abs_scaled = @intCast(scaled);
        }

        const int_part = abs_scaled / 100;
        const frac: u8 = @intCast(abs_scaled % 100);

        self.uint(int_part);

        if (frac == 0) return;

        self.byte('.');

        const tens = frac / 10;
        const ones = frac - tens * 10;

        self.byte('0' + tens);

        if (ones != 0) {
            self.byte('0' + ones);
        }
    }
};

export fn allocF64(len: usize) usize {
    const slice = allocator.alloc(f64, len) catch return 0;
    return @intFromPtr(slice.ptr);
}

export fn freeF64(ptr: usize, len: usize) void {
    if (ptr == 0 or len == 0) return;

    const slice = @as([*]f64, @ptrFromInt(ptr))[0..len];
    allocator.free(slice);
}

export fn resultPtr() usize {
    if (result_length == 0) return 0;
    return @intFromPtr(result_buffer.ptr);
}

export fn resultLen() usize {
    return result_length;
}

export fn buildMonotoneXPath(
    x_ptr: usize,
    y_ptr: usize,
    len: usize,
    smoothing: f64,
    bounds_min_x: f64,
    bounds_max_x: f64,
    bounds_min_y: f64,
    bounds_max_y: f64,
    layout_min_x: f64,
    layout_max_x: f64,
    layout_min_y: f64,
    layout_max_y: f64,
    visible_min_x: f64,
    visible_max_x: f64,
    visible_min_y: f64,
    visible_max_y: f64,
) u32 {
    clearResult();

    if (x_ptr == 0 or y_ptr == 0 or len == 0) return 0;
    if (!allFinite(.{
        smoothing,
        bounds_min_x,
        bounds_max_x,
        bounds_min_y,
        bounds_max_y,
        layout_min_x,
        layout_max_x,
        layout_min_y,
        layout_max_y,
        visible_min_x,
        visible_max_x,
        visible_min_y,
        visible_max_y,
    })) return 0;

    const input_x = @as([*]const f64, @ptrFromInt(x_ptr))[0..len];
    const input_y = @as([*]const f64, @ptrFromInt(y_ptr))[0..len];

    const w = bounds_max_x - bounds_min_x;
    const h = bounds_max_y - bounds_min_y;
    const layout_w = layout_max_x - layout_min_x;
    const layout_h = layout_max_y - layout_min_y;

    var visible_start = len;
    var visible_end: usize = 0;

    if (len == 1) {
        if (input_x[0] >= visible_min_x and input_x[0] <= visible_max_x and input_y[0] >= visible_min_y and input_y[0] <= visible_max_y) {
            visible_start = 0;
            visible_end = 0;
        }
    } else {
        for (0..(len - 1)) |i| {
            const seg_min_x = @min(input_x[i], input_x[i + 1]);
            const seg_max_x = @max(input_x[i], input_x[i + 1]);
            if (seg_max_x < visible_min_x or seg_min_x > visible_max_x) continue;

            const seg_min_y = @min(input_y[i], input_y[i + 1]);
            const seg_max_y = @max(input_y[i], input_y[i + 1]);
            if (seg_max_y < visible_min_y or seg_min_y > visible_max_y) continue;

            if (visible_start == len) visible_start = i;
            visible_end = i + 1;
        }
    }

    if (visible_start == len) return 1;

    if (visible_start > 0) visible_start -= 1;
    if (visible_end + 1 < len) visible_end += 1;

    const visible_len = visible_end - visible_start + 1;

    const x = allocator.alloc(f64, visible_len) catch return 0;
    defer allocator.free(x);

    const y = allocator.alloc(f64, visible_len) catch return 0;
    defer allocator.free(y);

    for (0..visible_len) |i| {
        const source_index = visible_start + i;
        x[i] = (input_x[source_index] - bounds_min_x) / w * layout_w + layout_min_x;
        y[i] = (bounds_max_y - input_y[source_index]) / h * layout_h + layout_min_y;

        if (!std.math.isFinite(x[i]) or !std.math.isFinite(y[i])) return 0;
    }

    if (visible_len == 1) {
        var writer_single = PathWriter.init(@max(@as(usize, 64), MOVE_CAPACITY)) catch return 0;
        emitMovePath(&writer_single, x[0], y[0]) catch {
            writer_single.deinit();
            return 0;
        };
        writer_single.finish();
        return 1;
    }

    if (visible_len == 2) {
        var writer_line = PathWriter.init(@max(@as(usize, 96), MOVE_CAPACITY + SEGMENT_CAPACITY)) catch return 0;
        emitLinePath(&writer_line, x[0], y[0], x[1], y[1]) catch {
            writer_line.deinit();
            return 0;
        };
        writer_line.finish();
        return 1;
    }

    const segment_count = visible_len - 1;

    const dx = allocator.alloc(f64, segment_count) catch return 0;
    defer allocator.free(dx);

    const slope = allocator.alloc(f64, segment_count) catch return 0;
    defer allocator.free(slope);

    const tangent = allocator.alloc(f64, visible_len) catch return 0;
    defer allocator.free(tangent);

    for (0..segment_count) |i| {
        dx[i] = x[i + 1] - x[i];
        const dy = y[i + 1] - y[i];
        const denom = if (dx[i] == 0.0) 1.0 else dx[i];
        slope[i] = dy / denom;

        if (!std.math.isFinite(slope[i])) return 0;
    }

    tangent[0] = slope[0];
    tangent[visible_len - 1] = slope[segment_count - 1];

    for (1..segment_count) |i| {
        const s0 = slope[i - 1];
        const s1 = slope[i];

        tangent[i] = if (s0 * s1 <= 0.0) 0.0 else (s0 + s1) / 2.0;
    }

    for (0..segment_count) |i| {
        if (slope[i] == 0.0) {
            tangent[i] = 0.0;
            tangent[i + 1] = 0.0;
        } else {
            const a = tangent[i] / slope[i];
            const b = tangent[i + 1] / slope[i];
            const hypotenuse = @sqrt(a * a + b * b);

            if (hypotenuse > 3.0) {
                const t = 3.0 / hypotenuse;
                tangent[i] = t * a * slope[i];
                tangent[i + 1] = t * b * slope[i];
            }
        }
    }

    const k = if (smoothing < 0.0) 0.0 else if (smoothing > 1.0) 1.0 else smoothing;

    var writer = PathWriter.init(@max(@as(usize, 128), visible_len * 96)) catch return 0;

    emitPath(&writer, x, y, dx, tangent, k) catch {
        writer.deinit();
        return 0;
    };

    writer.finish();

    return 1;
}

fn clearResult() void {
    result_length = 0;
}

fn allFinite(values: anytype) bool {
    inline for (values) |value| {
        if (!std.math.isFinite(value)) return false;
    }

    return true;
}

fn emitPath(writer: *PathWriter, x: []const f64, y: []const f64, dx: []const f64, tangent: []const f64, k: f64) !void {
    try writer.ensure(MOVE_CAPACITY);
    writer.text("M ");
    try writer.number2(x[0]);
    writer.byte(' ');
    try writer.number2(y[0]);

    for (0..dx.len) |i| {
        try writer.ensure(SEGMENT_CAPACITY);

        const cp1x = x[i] + (dx[i] / 3.0) * k;
        const cp1y = y[i] + ((tangent[i] * dx[i]) / 3.0) * k;

        const cp2x = x[i + 1] - (dx[i] / 3.0) * k;
        const cp2y = y[i + 1] - ((tangent[i + 1] * dx[i]) / 3.0) * k;

        writer.text("C ");
        try writer.number2(cp1x);
        writer.byte(' ');
        try writer.number2(cp1y);
        writer.text(", ");
        try writer.number2(cp2x);
        writer.byte(' ');
        try writer.number2(cp2y);
        writer.text(", ");
        try writer.number2(x[i + 1]);
        writer.byte(' ');
        try writer.number2(y[i + 1]);
        writer.byte(' ');
    }
}

fn emitMovePath(writer: *PathWriter, x: f64, y: f64) !void {
    try writer.ensure(MOVE_CAPACITY);
    writer.text("M ");
    try writer.number2(x);
    writer.byte(' ');
    try writer.number2(y);
}

fn emitLinePath(writer: *PathWriter, x0: f64, y0: f64, x1: f64, y1: f64) !void {
    try writer.ensure(MOVE_CAPACITY + SEGMENT_CAPACITY);
    writer.text("M ");
    try writer.number2(x0);
    writer.byte(' ');
    try writer.number2(y0);
    writer.text(" L ");
    try writer.number2(x1);
    writer.byte(' ');
    try writer.number2(y1);
}
