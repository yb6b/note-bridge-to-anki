<script setup lang="ts">
import cfgImg from '@/assets/config-anki-connect.png';
import instImge from '@/assets/install-anki-connect.png';

const origin = window.location.origin
const emits = defineEmits<{
    close: []
}>();

</script>
<template>
    <v-card max-width="50em"
            class="pa-6">
        <v-card-item>

            <v-card-title>如何使用 Anki Connect 插件</v-card-title>
        </v-card-item>
        <v-card-text>
            <p>AnkiConnect 插件可以让其他软件访问 Anki 软件里的数据。</p>
            <p>安装步骤：</p>
            <ol>
                <li>打开 Anki 软件</li>
                <li>点击菜单栏的“工具”，选择“插件”</li>
                <li>点击插件窗口的“获取插件…”按钮</li>
                <li>在安装插件窗口的“代码”输入框内填：<b>2055492159</b></li>
                <li>确定，等待，重新启动 Anki</li>
            </ol>
            <p>
                <img :src="instImge"
                     width="350"
                     alt="安装AnkiConnect" />
            </p>
            <p>安装完 AnkiConnect 插件之后，还要设置 AnkiConnect，让它赋予本网页访问Anki的权限。</p>
            <ol>

                <li>打开 Anki 软件</li>
                <li>点击菜单栏的“工具”，选择“插件”，打开插件窗口</li>
                <li><b>双击</b> AnkiConnect 列表项</li>
                <li>在弹出的“AnkiConnect 插件设置”窗口里修改，为 <code>webCorsOriginList</code> 下添加本网页的地址
                    <code>{{ origin }}</code>
                </li>
                <li>确定，重新启动 Anki</li>
            </ol>
            <p><img :src="cfgImg"
                     width="350"
                     alt="配置AnkiConnect" /></p>
            <details>
                <summary>AnkiConnect 插件的配置文件</summary>
                你也可以直接把下文复制到你的配置文件中：
                <pre>{
    "apiKey": null,
    "apiLogPath": null,
    "ignoreOriginList": [],
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    "webCorsOriginList": [
        "{{ origin }}",
        "http://localhost"
    ]
}</pre>
            </details>
        </v-card-text>
        <v-card-actions>
            <v-btn color="primary"
                   variant="flat"
                   @click="$emit('close')">
                关闭
            </v-btn>
        </v-card-actions>
    </v-card>


</template>