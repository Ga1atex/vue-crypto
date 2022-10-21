import { createStore } from "vuex";

export default createStore({
  state: {
    smth: false,
  },
  getters: {},
  mutations: {
    setSmth(state) {
      state.smth = !state.smth;
    },
  },
  actions: {
    // setSmth(context) {
    //   context.commit("setSmth");
    // },
  },
  modules: {},
});
