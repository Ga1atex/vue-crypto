import { createApp } from "vue";
import App from "./App.vue";
import "./assets/tailwind.css";
import router from "@/router/router";
import FocusLock from "@/components/common/FocusLock.vue";

const app = createApp(App);
app.use(router);
app.component("FocusLock", FocusLock);
app.mount("#app");
