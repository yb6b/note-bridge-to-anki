<script setup lang="ts">
import { mdiWifiCheck, mdiWifiOff, mdiWifiSettings, mdiHelpCircleOutline } from '@mdi/js'
import { useAnkiBaseStore } from '@/stores/share'

defineProps<{
    iconOnly?: boolean;
}>();

const openHelpDialog = ref(false)


const ankiBase = useAnkiBaseStore()
const isFetching = ref(false)
const iconAndColor = computed(() => isFetching.value ? [mdiWifiSettings, 'grey'] :
    (ankiBase.ready ? [mdiWifiCheck, 'green-darken-4'] : [mdiWifiOff, 'red']));
const errMsg = ref('')


let signal: AbortController | null
const checkAccessAnkiConnect = async () => {
    const url = new URL(ankiBase.url)
    const origin = url.origin
    if (signal) {
        signal.abort()
        signal = null
    }
    signal = new AbortController()
    isFetching.value = true
    try {
        const res = await fetch(origin, { signal: signal.signal });
        isFetching.value = false
        return res.ok;
    } catch (error) {
        isFetching.value = false
        return false;
    }
}


const urlRule = (url: string) => {
    try {
        const urlObj = new URL(url)
        if (urlObj.hostname === '0.0.0.0')
            return 'URL 不能是 0.0.0.0'
        if (urlObj.pathname !== '/' && urlObj.pathname !== '')
            return "URL 不能有路径"
        if (urlObj.search)
            return 'URL 不能有搜索参数'
        if (urlObj.hash)
            return 'URL 不能有 hash 参数'
    } catch (error) {
        return "URL 非法"
    }
    return ''
}


watch(() => ankiBase.url, async (newValue) => {
    const urlMsg = urlRule(newValue)
    if (urlMsg) {
        errMsg.value = urlMsg
        return
    }
    const ready = await checkAccessAnkiConnect()
    ankiBase.ready = ready
    errMsg.value = ready ? '' : '无法连接 AnkiConnect'
}, { immediate: true })


</script>

<template>
    <v-icon
        v-if="iconOnly"
        :icon="iconAndColor[0]"
        :color="iconAndColor[1]"
    />
    <v-text-field
        v-else
        label="AnkiConnect 地址"
        v-model="ankiBase.url"
        max-width="20em"
        style="font-family: monospace;"
        :error-messages="errMsg"
    >
        <template #prepend>
            <v-icon
                :icon="iconAndColor[0]"
                :color="iconAndColor[1]"
            />
        </template>
        <template #append>
            <v-dialog v-model="openHelpDialog">
                <template #activator="{ props: ap }">
                    <v-btn
                        v-bind="ap"
                        v-tooltip="'如何使用 AnkiConnect？'"
                        :icon="mdiHelpCircleOutline"
                        class="opacity-60"
                        variant="text"
                        density="compact"
                    />
                </template>
                <template #default="{ isActive }">
                    <open-anki-connect-card @close="isActive.value = false" />
                </template>
            </v-dialog>
        </template>
    </v-text-field>


</template>