<template lang="">
  <my-modal ref="confirmationModal">
    <!-- <my-modal :isOpen="isOpen" @close-modal="modalIsOpen = false"> -->
    <template v-slot:header> Danger Modal </template>
    <template v-slot:default>
      <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <div class="p-6 text-center">
          <svg
            class="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this product?
          </h3>
        </div>
      </div>
    </template>
    <template #footer="{ confirm, close }">
      <form
        @submit.prevent="submitForm(confirm)"
        class="flex items-center space-x-2 flex-auto"
      >
        <input
          v-model="submitText"
          :placeholder="'Please type in: ' + $options.CONFIRMATION_TEXT"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
        <button
          data-modal-toggle="popup-modal"
          type="submit"
          class="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center mr-2"
          :disabled="!isConfirmed"
        >
          Yes, I'm sure
        </button>
        <button
          data-modal-toggle="popup-modal"
          type="button"
          class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
          @click="close"
        >
          No, cancel
        </button>
      </form>
    </template>
  </my-modal>
</template>
<script>
import MyModal from "./common/MyModal";

export default {
  CONFIRMATION_TEXT: "confirm",
  components: {
    MyModal,
  },
  props: {
    isOpen: {
      type: Boolean,
    },
  },
  data() {
    return {
      submitText: "",
      // modalIsOpen: this.isOpen,
    };
  },
  methods: {
    async openModal() {
      const modalResult = await this.$refs.confirmationModal.open();

      if (modalResult) {
        console.log(modalResult);
      }
    },
    submitForm(confirm) {
      if (this.isConfirmed) {
        confirm();
        this.submitText = "";
      }
    },
  },
  computed: {
    isConfirmed() {
      return this.submitText === this.$options.CONFIRMATION_TEXT;
    },
  },
};
</script>
<style lang=""></style>
