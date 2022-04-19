import { KeysOrType } from "./ts"

export class Observable<Data>{
  private observers: ((updatedData: any) => void)[]

  constructor() {
    this.observers = []
  }

  subscribe(cb: (updatedData: KeysOrType<Data>) => void) {
    this.observers.push(cb)
  }

  unsubscribe(cb: (updatedData: KeysOrType<Data>) => void) {
    this.observers = this.observers.filter(observer => observer !== cb)
  }

  notify(data: KeysOrType<Data>) {
    console.log('Notifying all')
    this.observers.forEach(observer => observer(data))
  }
}