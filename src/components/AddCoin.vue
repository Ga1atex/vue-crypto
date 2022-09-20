<template lang="">
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="coinNameInput"
            @input="coinOnChange"
            @keydown.enter="add"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
          />
        </div>
        <div
          v-show="coinSuggestions.length"
          class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
        >
          <span
            v-for="coin of coinSuggestions"
            @click="
              coinNameInput = coin;
              add();
            "
            :key="coin"
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
          >
            {{ coin }}
          </span>
        </div>
        <div class="text-sm text-red-600" v-if="coinInputError">
          {{ coinInputError }}
        </div>
      </div>
    </div>
    <rounded-button @click="add" type="button">
      <!-- :disabled="!coinNameInput" -->
      <plus-sign-icon></plus-sign-icon>
      Добавить
    </rounded-button>
  </section>
</template>
<script>
import RoundedButton from "@/components/common/RoundedButton";
import PlusSignIcon from "@/components/PlusSignIcon";
export default {
  components: {
    RoundedButton,
    PlusSignIcon,
  },
  data() {
    return {
      coinNameInput: "",
      coinInputError: "",
      coinSuggestions: [],
    };
  },
  props: {
    allCoinData: {
      type: Object,
      required: true,
    },
    coins: {
      type: Array,
      required: false,
      default: () => [],
    },
  },
  emits: {
    "add-coin": (value) => typeof value === "string",
  },
  methods: {
    coinOnChange() {
      this.coinInputError = "";
      this.coinSuggestions = [];

      const coinName = this.coinNameInput.toUpperCase();

      if (coinName) {
        for (const coinValue of Object.values(this.allCoinData)) {
          if (this.coinSuggestions.length > 3) break;
          if (
            coinValue.Symbol.toUpperCase().includes(coinName) ||
            coinValue.FullName.toUpperCase().includes(coinName)
          ) {
            this.coinSuggestions.push(coinValue.Symbol.toUpperCase());
          }
        }
      }
    },
    add() {
      if (!this.coinNameInput) {
        this.coinInputError = "Введите значение";
        return;
      }

      const coinName = this.coinNameInput.toUpperCase();

      if (this.coins.some((t) => coinName === t.name)) {
        this.coinInputError = "Такой тикер уже добавлен";
      } else {
        this.$emit("add-coin", coinName);

        this.coinSuggestions = [];
        this.coinNameInput = "";
      }
    },
  },
};
</script>
<style lang=""></style>
