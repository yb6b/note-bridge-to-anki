import { YankiConnect } from 'yanki-connect'
import * as basicCards from '@/libs/basic-cards'

export const yanki = new YankiConnect()

type CreateModelParams = Parameters<
  YankiConnect['model']['createModel']
>[number]

export async function createModel(params: CreateModelParams) {
  try {
    await yanki.model.createModel(params)
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes('Model name already exists')) return
      throw e
    }
  }
}

export async function createDeck(deckName: string) {
  try {
    await yanki.deck.createDeck({ deck: deckName })
  } catch (error) {
    throw error
  }
}
