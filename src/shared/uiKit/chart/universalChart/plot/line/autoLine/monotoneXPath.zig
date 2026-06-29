// [BUILD]
// zig build-exe monotoneXPath.zig -target wasm32-freestanding -fno-entry -rdynamic -O ReleaseSmall

export fn add(a: i32, b: i32) i32 {
    return a + b;
}
