<template>
    <v-stepper
        v-model="step"
        :items="stepperItems"
        :editable="stepEditable"
        maxWidth="50em"
        hide-actions
    >
        <v-stepper-actions
            :disabled="disableStepperActions"
            @click:next="step++"
            @click:prev="step--"
        ></v-stepper-actions>
        <template v-slot:item.1>
            <v-file-input
                v-model="fileRef"
                label="选择 OPML 文件"
                hint="可以拖动 OPML 文件到此处"
                persistentHint
                density="comfortable"
                :errorMessages="readErrorMessage"
            />
            <!-- TODO: 验证格式 -->

            <v-divider class="my-6"></v-divider>

            <input-anki-connect-url />

            <!-- TODO: 更多教程：大㭎规范、哪里导出 -->

        </template>

        <template v-slot:item.2>
            <!-- 配置页面 -->
            <opml-configs />

        </template>

        <template v-slot:item.3>

            <v-textarea
                label="CSV 预览"
                v-model="csvPreview"
                wrap="off"
                rows="12"
                style="font-family: monospace;"
            />
            <div class="d-flex ga-2">
                <v-btn
                    variant="tonal"
                    :prepend-icon="mdiDownload"
                    @click="utils.downloadAsFile(csvPreview, store.baseName)"
                >下载 CSV</v-btn>
                <v-btn
                    :prepend-icon="mdiCastConnected"
                    color="primary"
                    variant="flat"
                    @click="() => { store.send(); step = 4 }"
                >
                    导入到 Anki</v-btn>
            </div>
        </template>

        <template v-slot:item.4>
            <h4 class="text-success">已发送{{ store.count }}条卡片到你的Anki上</h4>
            <div class="d-flex ga-2 my-2 ">
                <v-btn to="/">返回首页</v-btn>
                <v-btn @click="step = 1">再次导入 OPML 文件</v-btn>
                <v-btn @click="openAnki()">打开 Anki</v-btn>
            </div>
        </template>
    </v-stepper>
</template>
<script setup lang="ts">

import { useAnkiBaseStore } from '@/stores/share'
import { mdiDownload, mdiCastConnected } from '@mdi/js'
import * as opml from '@/stores/mubu-opml';
import * as utils from '@/libs/utils';


const store = opml.useMubuOpmlStore()
const ankiBase = useAnkiBaseStore()

const fileRef = ref<File>()
const csvPreview = ref('')
const readErrorMessage = ref('')

watch(fileRef, async (value) => {
    readErrorMessage.value = await store.read(value!) || ''
})

const step = ref(1)
const disableStepperActions = computed(() => {
    if (step.value === 1) {
        if (!fileRef.value) return true
        return 'prev'
    }
    if (step.value > 2) {
        return 'next'
    }
});

const stepEditable = computed(() => import.meta.env.DEV || !!fileRef.value);


watch(step, async (value, oldValue) => {
    if (oldValue === 1 && value === 2) {
        await ankiBase.fix()
    } else if (value === 3) {
        csvPreview.value = store.csvStr()
    }
})

const stepperItems = [
    '打开',
    '配置',
    '发送',
    '完成',
]

async function openAnki() {
    const r = await utils.yanki.graphical.guiBrowse({
        query: `deck:${store.deck}`,
    })
    console.log(r)
}


</script>