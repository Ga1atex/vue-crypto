<template lang="">
  <section class="relative">
    <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
      {{ selectedCoin.name }} - USD
    </h3>
    <div
      class="flex items-end border-gray-600 border-b border-l h-64"
      ref="graph"
    >
      <div
        v-for="(bar, i) in normalizeGraph"
        :key="i"
        :style="{ height: `${bar}%` }"
        class="bg-purple-800 border w-10"
        ref="graphbar"
      ></div>
    </div>
    <button @click="closeGraph" type="button" class="absolute top-0 right-0">
      <cross-sign></cross-sign>
    </button>
  </section>
</template>
<script>
import CrossSign from "./CrossSign";

export default {
  components: {
    CrossSign,
  },
  props: {
    selectedCoin: {
      type: [null, Object],
      required: true,
    },
    graph: {
      type: Array,
      required: true,
    },
  },
  emits: {
    "close-graph": null,
    "update-graph-bar-amount": null,
  },
  data() {
    return {
      maxGraphElements: 1,
      resizeObserver: null,
    };
  },
  methods: {
    closeGraph() {
      this.$emit("close-graph");
    },
    calculateMaxGraphElements() {
      if (!this.$refs.graph) return;

      this.maxGraphElements = Math.floor(
        this.$refs.graph?.clientWidth / (this.$refs.graphbar?.offsetWidth || 40)
      );
    },
    createResizeObserver() {
      this.resizeObserver = new ResizeObserver(this.updateGraphBarAmount);
    },
    updateGraphBarAmount() {
      this.calculateMaxGraphElements();
      this.$emit("update-graph-bar-amount", this.maxGraphElements);
      // if (this.graph.length > this.maxGraphElements) {
      //   this.graph = this.graph.slice(
      //     this.graph.length - this.maxGraphElements
      //   );
      // }
    },
  },
  computed: {
    normalizeGraph() {
      const maxValue = Math.max(...this.graph);
      const minValue = Math.min(...this.graph);

      if (maxValue === minValue) {
        return this.graph.map(() => 50);
      }

      return this.graph.map(
        (price) => 5 + ((price - minValue) * 95) / (maxValue - minValue)
      );
    },
  },
  mounted() {
    this.createResizeObserver();
    this.resizeObserver.observe(this.$refs.graph);
    // window.addEventListener("resize", this.updateGraphBarAmount);
  },
  beforeUnmount() {
    // this.resizeObserver.unobserve(this.$refs.graph);
    this.resizeObserver.disconnect();
    // window.removeEventListener("resize", this.updateGraphBarAmount);
  },
  watch: {
    // selectedCoin() {
    // 2 ways of syntax
    // this.$nextTick().then(() => {
    // this.$nextTick(() => {
    // if (this.$refs.graph) this.resizeObserver.observe(this.$refs.graph);
    // });
    // },
    graph() {
      this.updateGraphBarAmount();
    },
  },
};
</script>
<style lang=""></style>
