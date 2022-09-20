<template>
  <div class="dialog-focus-lock">
    <slot />
  </div>
</template>

<script>
export default {
  name: "focus-lock",
  data() {
    return {
      focusableEls: [],
      firstFocusableEl: [],
      lastFocusableEl: [],
      focusedElBeforeOpen: document.activeElement,
    };
  },

  methods: {
    handleDialogFocusLock() {
      const focusableElementsSelector =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

      const focusableElements = this.$el.querySelectorAll(
        focusableElementsSelector
      );
      this.focusableEls = focusableElements;
      this.firstFocusableEl = this.focusableEls[0]; // get first array item
      this.lastFocusableEl = focusableElements[focusableElements.length - 1]; // get last array item

      this.$el.addEventListener("keydown", this.handleKeyDown);
      this.firstFocusableEl.focus();
    },

    handleBackwardTab(e) {
      if (document.activeElement === this.firstFocusableEl) {
        e.preventDefault();
        this.lastFocusableEl.focus();
      }
    },

    handleForwardTab(e) {
      if (document.activeElement === this.lastFocusableEl) {
        e.preventDefault();
        this.firstFocusableEl.focus();
      }
    },

    handleKeyDown(e) {
      const isTabPressed = e.key === "Tab";

      if (!isTabPressed) return;

      if (this.focusableEls.length === 1) {
        e.preventDefault();
      }
      if (e.shiftKey) {
        this.handleBackwardTab(e);
      } else {
        this.handleForwardTab(e);
      }
    },
  },

  mounted() {
    this.handleDialogFocusLock();
  },
};
</script>
