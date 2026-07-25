

export interface State<Ctx> {
  setup(stateMachine: StateMachine<Ctx, State<Ctx>>, context: Ctx): void
  activated(): void
  created(): void
  disposed(): void
}

export class StateMachine<Ctx, S extends State<Ctx>> {
  protected _currentState: S
  readonly context: Ctx

  get currentState() {
    return this._currentState
  }

  constructor(initialState: S, context: Ctx) {
    this._currentState = initialState
    this.context = context
    initialState.setup(this, context)
    initialState.created()
  }

  changeState(newState: S) {
    this._currentState.disposed()
    this._currentState = newState
    newState.setup(this, this.context)
    newState.created()
  }

  returnToState(state: S) {
    this._currentState.disposed()
    this._currentState = state
    state.setup(this, this.context)
    state.activated()
  }
}

