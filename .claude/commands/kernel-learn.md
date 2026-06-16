---
description: linux-kernel-dev 学习循环 — 把一个刚解决的内核/BSP 坑沉成「规则 + 配套用例 + 注册」的原子三件套,带可执行检查、有回归证明。无可执行检查不准建。
---

# /kernel-learn — 把踩过的坑沉成带回归证明的规则

触发:刚解决了一个内核/BSP 陷阱(答案先错后对、或 critic/fact_gate 抓到问题),想让 skill 下次不再犯。

**地基规则(HARNESS-DESIGN §6.7,不可破)**:产出必须是**原子三件套**,缺一不建——
① 规则条目(内嵌可 grep 的 `[CLAIMS]`)② 配套冻结用例(gold=修法、corruption=坑)③ 注册。

## 步骤

1. **先筛**:用没这条规则的 skill 跑一遍这个坑,确认 base 确实会错/误导。第一次就答对的、或一直没解决的,**不建**。

2. **蒸成抽象通用原则**:一句话规则,**不写厂商/SoC/型号/内部路径/任务编号**。具体 API/CONFIG/路径只放进用例的 `gold_claims` / `corruptions`,不进规则正文(规则要 tree-agnostic)。

3. **去重**:跟 `known-bugs.md` / `dos-and-donts.md` 现有条目比;只是换种说法 → 合并 + 补一条用例,**不新开** KB/DD 编号。

4. **写规则条目**(`known-bugs.md` 坑 / `dos-and-donts.md` 稳定规则),按文件里的格式,**内嵌 `[CLAIMS]`** + `scope/limits`(版本区间/arch 假设)+ `provenance`(self / external)+ `linked_eval_case`。

5. **写配套用例** `tests/eval/cases/KV-NNN.json`:
   - `gold_claims` = 正确修法引用的真 API/CONFIG/符号(必须在树里查得到)
   - `corruptions` = 那个坑的错误断言(编造的 API / 错 CONFIG 等,必须被 fact_gate 抓)
   - `kind`(objective/subjective)、`rubric`、`forbidden`

6. **确定性验证(必须全过)**:
   ```bash
   node scripts/kernel_learn_validate.mjs --case tests/eval/cases/KV-NNN.json --rule <规则文件或 -> --tree <内核树>
   node scripts/regression_test.mjs --check --tree <内核树>
   ```
   - 第一条:gold 实存 + 坑全被抓 + 规则含 `[CLAIMS]`,否则**拒绝建**。
   - 第二条:没让已有用例退步。

7. **生成 1-3 条邻域用例**(换内核版本 / 邻近子系统 / 另一个 CONFIG),各自过 fact_gate 才入库——覆盖坑周围一圈,不只一个点。

8. **注册**:在 `evolution/rules.json` 登记(id / surface=known-bug|dos / linked_eval_case / fires=0 / catches=0)。fires/catches 计数由 P4 的 evolve-rules 维护(命中 +fire、真翻转 fail→pass +catch)。

9. **人来 commit**:本命令只建+验,提交由用户拍板。commit 无 Claude 署名。

## 硬约束
- 通用脱敏:规则正文 0 厂商名/型号/内部路径/任务编号。
- 不用 /tmp;临时产物落 `.scratch/`。
- 只用标准说法,不自造比喻词(见全局记忆:回归测试/测试用例/检查/记录表…)。
