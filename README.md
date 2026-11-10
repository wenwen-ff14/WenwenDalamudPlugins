# WenwenDalamudPlugins

wenwen-ff14 的統一 Dalamud 插件庫。遊戲內只需加入一個網址：

```text
https://raw.githubusercontent.com/wenwen-ff14/WenwenDalamudPlugins/main/pluginmaster.json
```

在 Dalamud 設定 → 實驗性 → 自訂插件庫加入上述網址並儲存，再到插件安裝器重新整理。

## 收錄插件

| 插件 | 來源專案 | API |
| --- | --- | --- |
| dsrsim-tc | [dsrsim-tc](https://github.com/wenwen-ff14/dsrsim-tc) | 13 |
| CrescentCompass | [Occult_Crescent_guide_TC](https://github.com/wenwen-ff14/Occult_Crescent_guide_TC) | 13 |
| TreasureKeeper | [TreasureKeeper](https://github.com/wenwen-ff14/TreasureKeeper) | 13 |
| TreasureKeeperGlobal | [TreasureKeeperGlobal](https://github.com/wenwen-ff14/TreasureKeeperGlobal) | 15 |
| MapPartyAssist（繁中預覽） | [MapPartyAssist-TW](https://github.com/wenwen-ff14/MapPartyAssist-TW) | 13 |
| Penumbra | [Penumbra-TW](https://github.com/wenwen-ff14/Penumbra-TW) | 13 |

合併清單不改變插件的客戶端／API 相容性，台服 API 13 不適用 API 15 的 TreasureKeeperGlobal。實際版本與 API 以 pluginmaster.json 為準。

## 從舊插件庫遷移

1. 先由原 Penumbra 插件庫更新到 1.5.1.29 或以上，該版本接受本統一網址。
2. 若使用開發版，先停用並移除其開發 DLL 路徑，再使用插件庫版。
3. 加入統一網址，停用或移除上述專案的舊插件庫網址，儲存並重新整理插件列表。
4. 若既有插件仍綁定舊來源而無法更新，使用插件安裝器從新來源重新安裝；先備份設定，勿選刪除設定。遇到來源警告可先保留原庫更新 Penumbra，再遷移。

## 自動同步

GitHub Actions 每小時第 23 分執行一次，也可到 Actions → Sync plugin repository → Run workflow 手動執行。排程可能延遲；公開倉庫連續 60 天沒有活動時，GitHub 可能停用排程，屆時到 Actions 重新啟用。

sources.json 是明確收錄清單；未來新增專案須在此登記，不會自動發布帳號中的所有專案。各插件仍在原專案維護與發布，下載網址直接指向原 ZIP。

同步會驗證識別名稱、必要欄位、版本、HTTPS 下載網址與連結可用性。來源失敗、版本倒退或重複識別名稱會中止並保留上一份清單。Penumbra 設有最低版本，避免發布不接受本來源的舊版。版本不變時不產生空提交。下載網址驗證不等於遊戲內功能測試。

本機執行（Node.js 24，無額外套件）：

```sh
node --test scripts/sync.test.mjs
node scripts/sync.mjs
```

