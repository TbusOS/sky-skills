# evolution/ — 记录表 + 规则（P4）

复用 design-evolve 的领域无关脚本，指向本目录:

```bash
# 记录表(改动实验流水):evolve-ledger.mjs 直接用 --ledger=
node ../../design-review/scripts/evolve-ledger.mjs --init \
  --ledger=skills/linux-kernel-dev/evolution/ledger.tsv

# 规则注册 + fires/catches:evolve-rules.mjs 加了 --registry= 覆盖
node ../../design-review/scripts/evolve-rules.mjs --register \
  --id=<id> --surface=<dos|known-bug> --skill=linux-kernel-dev --text="..." \
  --registry=skills/linux-kernel-dev/evolution/rules.json
node ../../design-review/scripts/evolve-rules.mjs --fire=<id> [--catch] --registry=...
node ../../design-review/scripts/evolve-rules.mjs --report --registry=...   # 按分数排,标 prune/dead
node ../../design-review/scripts/evolve-rules.mjs --lint   --registry=...   # 去重 + 死规则扫描
```

- 规则分 `s = (catches+1)/(fires+2)`（Laplace 平滑）。fires 多、catches 零 = 没用,prune 候选;从没 fire = 死规则,归档别删。
- 规则由 `/kernel-learn` 经原子三件套产出后注册;命中 `--fire`,真把 fail 翻成 pass 才 `--catch`。
- `ledger.tsv` 记每次内容改动实验(base/new/decision=keep|revert);keep/revert 只看客观用例(回归测试)。
- 文件是持久状态,入库。
