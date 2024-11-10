<script setup lang="ts">
import { useAnkiBaseStore } from '@/stores/share'
import * as opml from '@/stores/mubu-opml';
import * as utils from '@/libs/utils';
import { mdiCreation } from '@mdi/js'

const store = opml.useMubuOpmlStore()
const ankiBase = useAnkiBaseStore()

const decksItems = computed(() => {
    const decks = ankiBase.decks
    if (decks.includes(store.baseName))
        return decks
    return [...decks, store.baseName]
})

const opmlDepth = [
    { title: "一层", value: 1 },
    { title: "二层", value: 2 },
    { title: "三层", value: 3 },
    { title: "四层（默认）", value: 4 },
    { title: "五层", value: 5 },
]

async function useYbClozeModel() {
    const modelName = '挖空题(YB)'
    store.clozeM = modelName
    if (ankiBase.models.includes(modelName)) return
    const modelTemplates = await import('./modelTemplates')
    await utils.createModel({
        modelName,
        inOrderFields: ['text', "back"],
        isCloze: true,
        css: modelTemplates.css,
        cardTemplates: [
            {
                name: modelName,
                Front: modelTemplates.clozeFront,
                Back: modelTemplates.clozeBack,
            }
        ]
    })
    ankiBase.fix()
}
async function useYbBasicModel() {
    const modelName = '问答题(YB)'
    store.basicM = modelName
    if (ankiBase.models.includes(modelName)) return
    const modelTemplates = await import('./modelTemplates')
    await utils.createModel({
        modelName,
        inOrderFields: ['front', "back"],
        isCloze: false,
        css: modelTemplates.css,
        cardTemplates: [
            {
                name: modelName,
                Front: modelTemplates.basicFront,
                Back: modelTemplates.basicBack,
            }
        ]
    })
    ankiBase.fix()
}

</script>

<template>

    <v-select
        label="从大纲的第几层开始识别卡片？"
        max-width="16em"
        :items="opmlDepth"
        v-model="store.depth"
    />

    <v-combobox
        label="卡组名称"
        :items="decksItems"
        max-width="16em"
        v-model="store.deck"
    />
    <!-- TODO: 从文件名推测卡组 -->


    <h4 class="text-h6 text-high-emphasis mt-4">从哪里生成笔记的标签？</h4>
    <div class="d-flex flex-wrap ga-4">
        <v-checkbox
            v-model="store.tags.parent"
            hideDetails
            label="大纲层级"
        ></v-checkbox>
        <v-checkbox
            v-model="store.tags.mubuTags"
            hideDetails
        >
            <template v-slot:label>
                笔记内的 <b class="px-1"><kbd>&num;</kbd></b> 标签
            </template>
        </v-checkbox>
    </div>

    <v-divider class="my-8"></v-divider>

    <!-- 问答题 -->

    <div class="d-flex align">
        <v-combobox
            label="问答题的卡牌模板"
            max-width="16em"
            :items="ankiBase.models"
            v-model="store.basicM"
        />
        <VBtn
            color="primary"
            variant="text"
            :icon="mdiCreation"
            class="mb-4"
            @click="useYbBasicModel"
            v-tooltip="{ text: '使用本网站的问答题模板' }"
        />
    </div>

    <v-select
        label="如何区分问答题和挖空题？"
        maxWidth="32em"
        hideDetails
        v-model="store.disting"
        :items="opml.distinguishStrategies"
    />


    <v-divider class="my-8"></v-divider>


    <!-- 挖空题 -->

    <div class="d-flex align-center">
        <v-combobox
            label="挖空题的卡牌模板"
            max-width="16em"
            v-model="store.clozeM"
            :items="ankiBase.models"
        />
        <VBtn
            color="primary"
            variant="text"
            :icon="mdiCreation"
            class="mb-4"
            @click="useYbClozeModel"
            v-tooltip="{ text: '使用本网站的挖空题模板' }"
        />
    </div>

    <v-select
        label="如何处理一题多挖空？"
        :items="opml.multipleClozeStrategies"
        v-model="store.multiCloze"
        max-width="24em"
    />
    <h4 class="text-h6 text-high-emphasis">哪些部分看作挖空？</h4>
    <div class="d-flex flex-wrap ga-4">
        <template v-for="color in opml.clozeSourceFormatColors">
            <v-checkbox
                v-model="store.color"
                :value="color[1]"
                :color="`${color[1]}-darken-4`"
                density="comfortable"
                hideDetails
            >
                <template v-slot:label>
                    <span :class="`text-${color[1]}-darken-4 font-weight-bold`">{{ color[0] }}色文字</span>
                </template>
            </v-checkbox>
        </template>
    </div>

    <div class="d-flex flex-wrap ga-4">
        <template v-for="decoration in opml.clozeSourceFormatDecorations">
            <v-checkbox
                v-model="store.decoration"
                :value="decoration[1]"
                hideDetails
                density="comfortable"
            >
                <template v-slot:label>
                    <span :class="decoration[1]">{{ decoration[0] }}</span>
                </template>
            </v-checkbox>
        </template>
    </div>

</template>