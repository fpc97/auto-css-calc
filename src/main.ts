import store from './store'

import formInput from './form-input'
import graph from './graph'
import cssOutput from './css-output'
import sample from './sample'

formInput.initModel(store)
graph.initModel(store)

store.subscribe(formInput.update)
store.subscribe(graph.update)
store.subscribe(cssOutput.update)
store.subscribe(sample.update)
