<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div
      v-if="!isAppInitialized"
      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
    >
      <svg
        class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
    <div class="container">
      <add-coin
        @add-coin="addAndUpdate"
        :allCoinData="allCoinData"
        :coins="coins"
      />
      <template v-if="coins.length">
        <div>
          <hr class="w-full border-t border-gray-600 my-4" />
          <div class=""><span>Фильтр:</span> <input v-model="filter" /></div>
          <div class="" v-if="filteredList.length > 6">
            <rounded-button
              @click="page = +page - 1"
              :disabled="!(page > 1)"
              class="mx-2"
            >
              Назад
            </rounded-button>
            <rounded-button
              :disabled="!(page < Math.ceil(coins.length / pagePortionSize))"
              @click="page = +page + 1"
            >
              Вперед
            </rounded-button>
          </div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="paginatedCoin in paginatedList"
            :key="paginatedCoin.name"
            @click="!paginatedCoin.error && select(paginatedCoin)"
            :class="[
              {
                'border-4': selectedCoin === paginatedCoin,
              },
              paginatedCoin.error ? 'bg-red-100' : 'bg-white cursor-pointer',
            ]"
            class="overflow-hidden shadow rounded-lg border-purple-800 border-solid"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ paginatedCoin.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(paginatedCoin.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="handleDelete(paginatedCoin)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
      <price-graph
        @close-graph="selectedCoin = null"
        @update-graph-bar-amount="updateGraphBarAmount"
        :selectedCoin="selectedCoin"
        :graph="graph"
        v-if="selectedCoin"
      ></price-graph>
    </div>
  </div>
</template>

<script>
import { requestCoins, subscribeToCoin, unsubscribeFromCoin } from "./api/api";
import AddCoin from "./components/AddCoin";
import RoundedButton from "./components/common/RoundedButton";
import PriceGraph from "./components/PriceGraph";

export default {
  name: "App",
  components: {
    AddCoin,
    RoundedButton,
    PriceGraph,
  },
  data() {
    return {
      coinInputError: "",
      coins: [],
      coinSuggestions: [],
      selectedCoin: null,
      graph: [],
      allCoinData: {},
      isAppInitialized: false,
      filter: "",
      page: 1,
      pagePortionSize: 6,
    };
  },
  created() {
    this.syncFromUrl();
    this.syncFromLocalStorage();
  },
  computed: {
    // ...mapMutations(["someMutation"]),
    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page,
      };
    },
    startPageIndex() {
      return (this.page - 1) * this.pagePortionSize;
    },
    endPageIndex() {
      return this.page * this.pagePortionSize;
    },
    filteredList() {
      return this.coins.filter((coin) =>
        coin.name.includes(this.filter.toUpperCase())
      );
    },
    paginatedList() {
      return this.filteredList.slice(this.startPageIndex, this.endPageIndex);
    },
  },
  methods: {
    smth() {
      this.$store.commit("setSmth");
      console.log(this.$store.state.smth);
    },
    syncFromLocalStorage() {
      const coinsData = localStorage.getItem("crypto-list");

      if (coinsData?.length) {
        this.coins = JSON.parse(coinsData);
        this.coins.forEach((coin) => {
          this.subscribeToCoinEvents(coin.name);
        });
      }
    },
    handleStorageEvent(e) {
      if (e.key != "crypto-list") return;

      const { newValue, oldValue } = e;

      this.coins = JSON.parse(newValue);
      const newCoinsList = JSON.parse(newValue);
      const oldCoinsList = JSON.parse(oldValue);

      if (newCoinsList.length > oldCoinsList.length) {
        const newCoins = newCoinsList.slice(oldCoinsList.length);

        newCoins.forEach((coin) => {
          this.subscribeToCoinEvents(coin.name);
        });
      }
    },
    syncFromUrl() {
      const windowData = Object.fromEntries(
        new URL(window.location).searchParams.entries()
      );

      const VALID_KEYS = ["filter", "page"];
      VALID_KEYS.forEach((key) => {
        if (windowData[key]) {
          this[key] = windowData[key];
        }
      });
    },
    updateGraphBarAmount(maxGraphElements) {
      if (this.graph.length > maxGraphElements) {
        this.graph = this.graph.slice(this.graph.length - maxGraphElements);
      }
    },
    updateCoinPrice(coinName, price) {
      const currentCoin = this.coins.find((coin) => coin.name === coinName);
      if (currentCoin === this.selectedCoin) {
        // this.graph.push(price);
        this.graph = [...this.graph, price];
      }
      currentCoin.price = price;
    },
    setCoinError(coinName, errorMessage) {
      const currentCoin = this.coins.find((coin) => coin.name === coinName);
      currentCoin.error = errorMessage;
    },
    addAndUpdate(coinName) {
      const currentCoin = {
        name: coinName,
        price: null,
      };
      // make a new array so watch will work
      this.coins = [...this.coins, currentCoin];
      // this.coins.push(currentcoin);
      this.filter = "";
      this.subscribeToCoinEvents(currentCoin.name);
    },
    formatPrice(price) {
      if (price === null) {
        return "-";
      }
      if (typeof price === "string") price = Number(price);
      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },
    updateCoinsInLocalStorage() {
      localStorage.setItem("crypto-list", JSON.stringify(this.coins));
    },
    handleDelete(coin) {
      this.coins = this.coins.filter((t) => t !== coin);

      if (this.selectedCoin === coin) {
        this.selectedCoin = null;
      }
      unsubscribeFromCoin(coin.name);
    },
    select(coin) {
      this.selectedCoin = coin;
    },
    async getCoinsData() {
      try {
        const coinsData = await requestCoins();
        this.allCoinData = coinsData.Data;
      } catch (error) {
        console.log(error);
      } finally {
        this.isAppInitialized = true;
      }
    },
    subscribeToCoinEvents(coin) {
      subscribeToCoin(coin, {
        success: (newPrice) => this.updateCoinPrice(coin, newPrice),
        fail: (errorMessage) => this.setCoinError(coin, errorMessage),
      });
    },
  },
  mounted() {
    this.getCoinsData();

    window.addEventListener("storage", this.handleStorageEvent);
  },
  beforeUnmount() {
    window.removeEventListener("storage", this.handleStorageEvent);
  },
  watch: {
    selectedCoin() {
      this.graph = [this.selectedCoin?.price];
    },
    paginatedList() {
      if (this.paginatedList.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },
    coins() {
      this.updateCoinsInLocalStorage();
    },
    filter() {
      this.page = 1;
    },
    pageStateOptions(params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });

      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?${searchParams}`
      );
    },
  },
};
</script>

<style src="./assets/tailwind.css"></style>
