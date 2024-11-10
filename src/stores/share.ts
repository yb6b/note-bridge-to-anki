import { defineStore, acceptHMRUpdate } from 'pinia'
import * as utils from '@/libs/utils'

export const useAnkiBaseStore = defineStore('anki_basic_info', {
  state: () => ({
    url: 'http://localhost:8765',
    /** 所有的卡组名 */
    decks: [] as string[],
    /** 所有的卡片类型名 */
    models: [] as string[],
    /** 是否已经连接到 Anki */
    ready: false,
  }),
  getters: {
    origin(): string {
      return new URL(this.url).origin
    },
  },
  actions: {
    /** 填充decks和models */
    async fix() {
      const yanki = utils.yanki
      this.decks = await yanki.deck.deckNames()
      this.models = await yanki.model.modelNames()
    },
  },
  persist: {
    pick: ['url', 'decks', 'models'],
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnkiBaseStore, import.meta.hot))
}
