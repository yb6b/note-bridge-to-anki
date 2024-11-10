# 幕布的OPML格式

幕布的OPML格式是一种XML格式，它可以用来导入和导出笔记。

它的格式如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>mubu2anki 范文</title>
  </head>
  <body>
    <outline text="极简示范" _mubu_text="<🙈……>" _note="" _mubu_note="">
      <outline text="第01章" _mubu_text="%3Cspan%3E%E7%AC%AC01%E7%AB%A0%3C/span%3E" _note="" _mubu_note="">
        <outline text="第01节" _mubu_text="%3Cspan%3E%E7%AC%AC01%E8%8A%82%3C/span%3E" _note="" _mubu_note="">
          <outline text="这里是问题？？" _mubu_text="<🙈……>" _note="" _mubu_note="">
            <outline text="这里是答案1" _mubu_text="<🙈……>" _note="" _mubu_note=""/>
          </outline>
        </outline>
      </outline>
    </outline>
  </body>
</opml>
```

而转换出的Anki卡片格式如下：

```js
{
 "header": "#seperator:Tab\n#tags:MB",
 "lines": [
   {
     "type": "Basic",
     "front": <Document object>,
     "back": <Document object>,
     "deck": "a",
     "tag": "b"
   },
   {
     "type": "Cloze",
     "text": <Document object>,
     "back": <Document object>,
     "deck": "a",
     "tag": "b"
   }
 ]
}
```
