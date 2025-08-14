

export interface ReusableTableCell<T> {
  configure(data: T): void;
  dispose(): void;
  root: HTMLElement;
}

export abstract class ReusableTableCellBase<T> implements ReusableTableCell<T> {
  abstract root: HTMLElement;
  abstract configure(data: T): void
  dispose(): void { }
}

export interface ReusableTableDataSource<Data> {

}