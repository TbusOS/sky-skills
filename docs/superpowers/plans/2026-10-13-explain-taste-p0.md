# explain-taste P0 实施计划:常驻规则 + anthropic / graphite 样板

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 平常对话默认按 explain-ladder 的常驻规则写(STE 默认开);anthropic、graphite 两个设计 skill 每次动笔前读口味、交付后记评价,作为其余 9 个风格的样板。

**Architecture:** 两条路(设计书 §1)。① `skills/explain-ladder/always-on.md` 由 `install_always_on.sh` 装进 Claude Code / Codex / Gemini 的全局规则,每轮都在上下文里;② 设计 skill 的 SKILL.md 最前面加「0. 每次都做」,把 design-taste 和 explain-ladder 带上。anthropic 新加口味参数表:两个倍数乘在 anthropic.css 的变量上,换算由共用的 `design-taste/assets/page-css.js` 做。

**Tech Stack:** bash(要兼容 macOS 自带的 3.2)、Node.js ESM / UMD(浏览器和 Node 都能加载)、playwright(仓库根 `node_modules`)、Markdown / HTML。

**Spec:** [需求](../specs/2026-10-13-explain-taste-requirements.md) · [设计书](../specs/2026-10-13-explain-taste-design.md)。本计划对应需求 §7 的 P0。

**计划里的代码怎么来的**:2026-10-13 在 main `53bc5d6` 的一份临时副本(git worktree)里逐个写出、跑过;
新文件是全文,改已有文件给的是 diff。下面每一步的「预期输出」都是那次实跑的真实输出。

## Global Constraints

- 中文文档推送前过两张词表(商业黑话、自造简称)`--strict`,0 error;新写的内容不能多出 warn(R-N4)。
- 外发前跑脱敏检查,0 命中:`bash .superpowers/sdd/2026-10-10-inkwash-p0/tools/redact.sh <文件…>`(R-N4)。
- 提交信息不加任何 AI 署名(R-N5;user 全局规则,优先于工具默认的署名提示)。
- 常驻规则 ≤ 25 行(R-N2);现在 22 行。
- 口味记录为空时 `suggest --css` 输出 0 字节,页面一个字节都不变(R-N1)。
- shell 脚本要在 macOS 自带的 bash 3.2 下能跑:不用关联数组、`readlink -f`、`mapfile`。
- 代码在分支 `feat/explain-taste` 上,每个任务提交并推送;验收后开 PR,由 user 确认合并。
- 改私有仓之前先 `bin/repo_lock.sh acquire --why "…"`,完了 `release`(私有仓 README 第 19 行起)。
- 本机的两个坑:Bash 工具每次调用会把当前目录重置回仓库根,改文件一律用绝对路径;zsh 不会把 `$X` 拆成多个参数,
  要拆就写 `${=X}`,或者把命令包成函数。

## Review Focus

需求里没写、但用户实际会碰到的五种情况。每一条在对应任务里都有测试:

1. 用户的 `AGENTS.md` 最后一行没有换行:插入时不能把那一行和起始标记粘在一起;卸完只多一个换行(Task 1 I13)。
2. 仓库 clone 搬了目录:Claude Code 那个链接指向旧路径;`refresh` 要把它重新指到新位置(Task 1 I14)。
3. `AGENTS.md` 本身是指向 dotfiles 仓库的链接:装和卸都不能把它换成普通文件(Task 1 I15)。
4. 在没有某个参数的风格里说共享词(在 anthropic 里说「字太小」):不能被丢掉,要传给有这个参数的风格(Task 3 P6)。
5. 有任务在跑时用户说「停止」:先停任务,再问 STE 要不要也关,不能一声不响把 STE 关了。这一条是常驻规则的措辞,
   脚本测不了,放在 Task 9 人工验收里。

---

### Task 1: 开分支;常驻规则和安装脚本

**Files:**
- Create: `skills/explain-ladder/always-on.md`
- Create: `skills/explain-ladder/scripts/install_always_on.sh`
- Modify: `docs/superpowers/ROADMAP.md`(「进行中」explain-taste 一节的「开发分支」「当前阶段」两行)

**Interfaces:**
- Consumes:无。
- Produces:`install_always_on.sh [install|refresh|uninstall] [--dry-run] [--claude-md] [--self-test]`,退出码 0 成功 / 1 自测失败 / 2 参数错。
  `refresh` 只刷新已经装过的(Task 2 的 `do-update.sh` 调它)。装好后 Claude Code 的规则文件是
  `~/.claude/rules/sky-skills-explain-ladder.md`(Task 5 的「加载时自查」看它在不在)。
  起止标记:`<!-- BEGIN: sky-skills explain-ladder v1 -->` / `<!-- END: sky-skills explain-ladder v1 -->`。

- [ ] **Step 1: 开分支并推送**

```bash
cd <仓库根> && git status -sb && git rev-parse HEAD     # 要在 main,工作区干净
git checkout -b feat/explain-taste && git push -u origin feat/explain-taste
```

- [ ] **Step 2: 写常驻规则 `skills/explain-ladder/always-on.md`**(22 行;跟设计书 §2 的原文逐字相同)

```markdown
<!-- sky-skills explain-ladder 常驻规则 v1 · 源文件 skills/explain-ladder/always-on.md -->
# 讲清楚(sky-skills explain-ladder,常驻)

每条回答都要让读者一次看懂。先选形式,再动笔:

| 读者要的是 | 用 |
|---|---|
| 结论、数字、一步操作 | 文字 |
| 关系:谁调用谁、数据从哪到哪、卡在哪一步 | 先给图,再写字。终端里用 ASCII 图,≤ 80 列,汉字算两列 |
| 一大批记录、长时间线、要过滤排序 | 提议做一个看完就扔的网页(explain-ladder 第 3 级) |
| 先后顺序和时机本身就是要点 | 视频明显更好时提一句,对方点头才做(第 4 级) |

文字按 STE(ASD-STE100)打八折写,默认开着:
1. 一句只说一件事。 2. 写出谁做。 3. 同一个东西只用一个名字。
4. 句子短:说明句 ≤ 50 字或 25 词,操作句 ≤ 30 字或 20 词。
5. 动词直接写:写「烧录固件」,不写「对固件进行烧录」。
6. 一步一个动作,条件写在动作前面。 7. 不确定就直说,写出要查什么。

- 代码、命令、日志原文、引用不改写。回答用什么语言照旧。
- 对方说「停止」或「关掉 STE」:本次会话不再按 STE 写,新会话又默认开着。有任务在跑时单说「停止」,先停任务,再问 STE 要不要也关。
- 跟用户自己的规则冲突时,以用户的规则为准。
- 做给别人看的页面或正式出图,用 sky-skills 的设计 skill。
```

检查:`wc -l < skills/explain-ladder/always-on.md` 输出 `22`;
`python3 skills/explain-ladder/scripts/check_ste.py skills/explain-ladder/always-on.md` 输出「没有发现」。

- [ ] **Step 3: 写安装脚本 `skills/explain-ladder/scripts/install_always_on.sh`**,并 `chmod +x`

脚本把自测写在自己里面(`--self-test`)。测试是否真的有用,靠两处「故意改坏」来证明:
`ALWAYS_ON_MUTATE=nostrip` 让重复安装时不删旧的一段,I2 必须失败;`keepblank` 让卸载时留下插入时加的空行,I8 必须失败。

```bash
#!/usr/bin/env bash
# install_always_on.sh — 把 explain-ladder 的常驻规则装进本机各 AI CLI 的全局规则,
# 让平常对话每轮都按「四级怎么选 + STE 七条」写。
#
#   install_always_on.sh              装或刷新:本机有哪个 CLI 就装哪个
#   install_always_on.sh refresh      只刷新已经装过的(autoupdate 的 do-update.sh 拉完新版后调)
#   install_always_on.sh uninstall    卸掉;规则文件里别的内容不动
#   install_always_on.sh --dry-run    只打印要改什么
#   install_always_on.sh --claude-md  Claude Code 改成往 ~/.claude/CLAUDE.md 插一段
#                                     (老版本不加载 ~/.claude/rules/ 时用)
#   install_always_on.sh --self-test  在临时家目录里装、重复装、刷新、卸(15 项),再故意改坏两处
#
# 装到哪(设计书 docs/superpowers/specs/2026-10-13-explain-taste-design.md §3):
#   Claude Code  ~/.claude/rules/sky-skills-explain-ladder.md,符号链接指向仓库里的
#                always-on.md。单独一个文件,不碰用户的 CLAUDE.md;git pull 后自动是新版。
#   Codex        ~/.codex/AGENTS.md 里带起止标记的一段。是复制进去的,所以要 refresh。
#   Gemini CLI   ~/.gemini/GEMINI.md 里带起止标记的一段。
# 改已有文件前先复制一份 .bak。新规则要新开会话才生效。
#
# 退出码:0 成功 · 1 自测失败 · 2 参数错
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
SELF="$HERE/$(basename "${BASH_SOURCE[0]}")"
SRC="${ALWAYS_ON_SRC:-$(cd "$HERE/.." && pwd -P)/always-on.md}"
BEGIN='<!-- BEGIN: sky-skills explain-ladder v1 -->'
END='<!-- END: sky-skills explain-ladder v1 -->'
LINK="$HOME/.claude/rules/sky-skills-explain-ladder.md"
BLOCK_FILES="$HOME/.claude/CLAUDE.md $HOME/.codex/AGENTS.md $HOME/.gemini/GEMINI.md"
MUTATE="${ALWAYS_ON_MUTATE:-}"   # 只给自测用:故意改坏某一步,看测试会不会失败

CMD=install; DRY=0; CLAUDE_MD=0
for a in "$@"; do
  case "$a" in
    install|refresh|uninstall) CMD="$a" ;;
    --dry-run) DRY=1 ;;
    --claude-md) CLAUDE_MD=1 ;;
    --self-test) CMD=selftest ;;
    -h|--help) sed -n '2,11p' "$SELF" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "不认识的参数:$a" >&2; exit 2 ;;
  esac
done

say() { printf '%s\n' "$*"; }

# 本机有没有这个 CLI。ALWAYS_ON_CLIS 只给自测用:本机真装了 codex,自测不能去看真的。
has() {
  if [ -n "${ALWAYS_ON_CLIS+x}" ]; then
    case " $ALWAYS_ON_CLIS " in *" $1 "*) return 0 ;; *) return 1 ;; esac
  fi
  case "$1" in
    claude) [ -d "$HOME/.claude" ] ;;
    codex)  command -v codex >/dev/null 2>&1 || [ -d "$HOME/.codex" ] ;;
    gemini) command -v gemini >/dev/null 2>&1 || [ -d "$HOME/.gemini" ] ;;
  esac
}

has_block() { [ -f "$1" ] && grep -qxF "$BEGIN" "$1"; }

# 删掉标记之间那一段,连同它前面那一个空行(插入时加的);标记之外一个字不动。
# 用 cat > 写回,不用 mv:保留原文件的权限,也不会把指向别处的链接换成普通文件。
strip() {
  [ -f "$1" ] || return 0
  local tmp keep=0
  [ "$MUTATE" = keepblank ] && keep=1
  tmp="$(mktemp "${TMPDIR:-/tmp}/always-on.XXXXXX")"
  awk -v b="$BEGIN" -v e="$END" -v keep="$keep" '
    $0 == b { skip = 1; if (held && prev == "" && !keep) held = 0; next }
    skip    { if ($0 == e) skip = 0; next }
            { if (held) print prev; prev = $0; held = 1 }
    END     { if (held) print prev }' "$1" > "$tmp" && cat "$tmp" > "$1"
  rm -f "$tmp"
}

# 插入(或换成新版):先删旧的一段再接到文件末尾,所以永远只有一份。
put_block() {
  if [ "$DRY" = 1 ]; then say "  [dry-run] $1 ← 插入(或换成新版)常驻规则那一段"; return; fi
  mkdir -p "$(dirname "$1")"
  local what=插入
  has_block "$1" && what=换成新版
  [ -f "$1" ] && cp "$1" "$1.bak"
  [ "$MUTATE" = nostrip ] || strip "$1"
  {
    if [ -s "$1" ]; then
      [ -n "$(tail -c1 "$1")" ] && echo   # 原文件最后一行没换行,先补上
      echo
    fi
    echo "$BEGIN"; cat "$SRC"; echo "$END"
  } >> "$1"
  say "  $1:常驻规则那一段$what"
}

drop_block() {
  has_block "$1" || return 0
  if [ "$DRY" = 1 ]; then say "  [dry-run] $1 → 删掉常驻规则那一段"; return; fi
  cp "$1" "$1.bak"; strip "$1"
  if [ -s "$1" ]; then say "  $1:删掉常驻规则那一段"
  else rm -f "$1" "$1.bak"; say "  $1:只剩这一段,文件是本工具建的,删掉"; fi
}

link_claude() {
  if [ -e "$LINK" ] && [ ! -L "$LINK" ]; then
    say "  Claude Code:$LINK 是普通文件,不是本工具装的,不动它"; return
  fi
  if [ "$DRY" = 1 ]; then say "  [dry-run] ln -sfn $SRC $LINK"; return; fi
  mkdir -p "$(dirname "$LINK")"
  ln -sfn "$SRC" "$LINK"
  say "  Claude Code:$LINK → $SRC"
}

install() {
  [ -f "$SRC" ] || { echo "找不到规则源文件 $SRC" >&2; exit 2; }
  local any=0
  if has claude; then
    if [ "$CLAUDE_MD" = 1 ]; then put_block "$HOME/.claude/CLAUDE.md"; else link_claude; fi
    any=1
  fi
  if has codex;  then put_block "$HOME/.codex/AGENTS.md"; any=1; fi
  if has gemini; then put_block "$HOME/.gemini/GEMINI.md"; any=1; fi
  if [ "$any" = 0 ]; then say "本机没找到 Claude Code / Codex / Gemini CLI,什么都没装"; return; fi
  say "新开一个会话才生效。自查:在新会话里问「你现在加载了哪些全局规则」。"
}

# 只刷新已经装过的,没装过的不新装。链接指向别处(仓库搬了家)就重新指。
refresh() {
  [ -f "$SRC" ] || { echo "找不到规则源文件 $SRC" >&2; exit 2; }
  if [ -L "$LINK" ] && [ "$(readlink "$LINK")" != "$SRC" ]; then link_claude; fi
  local f
  for f in $BLOCK_FILES; do has_block "$f" && put_block "$f"; done
  return 0
}

uninstall() {
  if [ -L "$LINK" ]; then
    if [ "$DRY" = 1 ]; then say "  [dry-run] rm $LINK"; else rm -f "$LINK"; say "  删掉 $LINK"; fi
  fi
  local f
  for f in $BLOCK_FILES; do drop_block "$f"; done
  return 0
}

# ── 自测 ──
selftest() {
  local root H src fails=0 M="${ALWAYS_ON_SELFTEST_M:-}"
  root="$(mktemp -d "${TMPDIR:-/tmp}/always-on-test.XXXXXX")"
  H="$root/home"; src="$root/always-on.md"
  mkdir -p "$H/.claude" "$H/.codex" "$H/.gemini"
  printf '# 我自己的规则\n\n第一条\n' > "$H/.codex/AGENTS.md"
  cp "$H/.codex/AGENTS.md" "$root/orig"
  printf 'v1 规则\n' > "$src"
  run() { HOME="$H" ALWAYS_ON_SRC="$src" ALWAYS_ON_CLIS="${CLIS:-claude codex gemini}" ALWAYS_ON_MUTATE="$M" bash "$SELF" "$@" >/dev/null 2>&1; }
  ok() { if eval "$2"; then say "  通过  $1"; else say "  失败  $1"; fails=$((fails + 1)); fi; }
  local L="$H/.claude/rules/sky-skills-explain-ladder.md" A="$H/.codex/AGENTS.md" G="$H/.gemini/GEMINI.md"

  run install; run install
  ok 'I1 Claude Code:是一个链接,指向规则源文件' '[ -L "$L" ] && [ "$(readlink "$L")" = "$src" ]'
  ok 'I2 装两次,AGENTS.md 里还是只有一段' '[ "$(grep -cxF "$BEGIN" "$A")" = 1 ]'
  { cat "$root/orig"; echo; echo "$BEGIN"; cat "$src"; echo "$END"; } > "$root/want"
  ok 'I3 AGENTS.md = 原内容 + 一个空行 + 这一段,逐字节相同' 'cmp -s "$A" "$root/want"'
  ok 'I4 原来没有 GEMINI.md:新建,里面只有这一段' '[ "$(head -1 "$G")" = "$BEGIN" ] && [ "$(tail -1 "$G")" = "$END" ]'
  printf 'v2 规则\n' > "$src"; run refresh
  ok 'I5 refresh:AGENTS.md 那一段换成新版' 'grep -qx "v2 规则" "$A" && ! grep -qx "v1 规则" "$A"'
  run --dry-run uninstall
  ok 'I6 --dry-run 不改任何文件' '[ -L "$L" ] && has_block "$A" && has_block "$G"'
  run uninstall
  ok 'I7 卸完:链接没了' '[ ! -e "$L" ] && [ ! -L "$L" ]'
  ok 'I8 卸完:AGENTS.md 跟装之前逐字节相同' 'cmp -s "$A" "$root/orig"'
  ok 'I9 卸完:本工具新建的 GEMINI.md 和它的 .bak 都删掉' '[ ! -e "$G" ] && [ ! -e "$G.bak" ]'
  run refresh
  ok 'I10 没装过时 refresh 什么都不建' '[ ! -e "$L" ] && [ ! -e "$G" ] && ! has_block "$A"'
  mkdir -p "$(dirname "$L")"; printf '用户自己的\n' > "$L"; run install
  ok 'I11 同名的普通文件不是本工具装的,不覆盖' '[ ! -L "$L" ] && grep -qx "用户自己的" "$L"'
  rm -f "$L"; CLIS=claude run install --claude-md
  ok 'I12 --claude-md:CLAUDE.md 里一段,不建链接' 'has_block "$H/.claude/CLAUDE.md" && [ ! -e "$L" ]'

  # 用户实际会碰到的三种情况
  printf '最后一行没有换行' > "$A"; CLIS=codex run install; CLIS=codex run uninstall
  ok 'I13 原文件最后一行没换行:卸完只多一个换行,其余不变' '[ "$(cat "$A")" = "最后一行没有换行" ] && [ "$(wc -l < "$A" | tr -d " ")" = 1 ]'
  ln -sfn "$root/搬家前/always-on.md" "$L"; CLIS=claude run refresh
  ok 'I14 仓库搬了家,链接指向旧路径:refresh 后指向新位置' '[ "$(readlink "$L")" = "$src" ]'
  rm -f "$A"; printf '# dotfiles 里的规则\n' > "$root/dotfiles-AGENTS.md"; ln -s "$root/dotfiles-AGENTS.md" "$A"
  CLIS=codex run install
  ok 'I15 AGENTS.md 是指向 dotfiles 的链接:链接还在,段写进它指向的文件' '[ -L "$A" ] && has_block "$root/dotfiles-AGENTS.md"'
  rm -rf "$root"

  if [ -z "$M" ]; then
    say "故意改坏(每处都必须让对应的测试失败)"
    local m want out
    for m in nostrip:I2 keepblank:I8; do
      want="${m#*:}"; m="${m%%:*}"
      out="$(ALWAYS_ON_SELFTEST_M="$m" bash "$SELF" --self-test 2>&1)"
      if printf '%s\n' "$out" | grep -q "失败  $want "; then say "  通过  $m → $want 失败,本该如此"
      else say "  失败  $m → $want 仍然通过:这条测试没看住这一步"; fails=$((fails + 1)); fi
    done
  fi
  say "自测:$([ "$fails" = 0 ] && echo 全部通过 || echo "$fails 项失败")"
  [ "$fails" = 0 ]
}

case "$CMD" in
  install) install ;;
  refresh) refresh ;;
  uninstall) uninstall ;;
  selftest) selftest || exit 1 ;;
esac
```

- [ ] **Step 4: 跑自测,新旧两版 bash 各一次**

```bash
bash skills/explain-ladder/scripts/install_always_on.sh --self-test
env PATH=/bin:/usr/bin:/usr/sbin:/sbin /bin/bash skills/explain-ladder/scripts/install_always_on.sh --self-test | tail -1
```

预期:第一条列出 I1–I15 共 15 行「通过」,接着

```
故意改坏(每处都必须让对应的测试失败)
  通过  nostrip → I2 失败,本该如此
  通过  keepblank → I8 失败,本该如此
自测:全部通过
```

第二条(PATH 上只有 bash 3.2)输出 `自测:全部通过`。

- [ ] **Step 5: 看一眼 `--dry-run`,确认它不会动本机的真配置**

```bash
bash skills/explain-ladder/scripts/install_always_on.sh --dry-run
```

预期:每个本机有的 CLI 一行 `[dry-run] …`,然后是「新开一个会话才生效」那句;`~/.claude/rules/`、`~/.codex/` 下没有新文件。
**这一步不真装**:装进 user 本机的全局规则在 Task 9,先问 user。

- [ ] **Step 6: ROADMAP 记下分支和阶段**

`docs/superpowers/ROADMAP.md`「讲清楚 + 口味学习…(explain-taste)」一节:
「开发分支」改成 `` [`feat/explain-taste`](https://github.com/TbusOS/sky-skills/tree/feat/explain-taste) —— 开发期间最新进度看这个分支上的本文件 ``;
「实施计划」改成 `[plans/2026-10-13-explain-taste-p0.md](plans/2026-10-13-explain-taste-p0.md)`;
「当前阶段」改成 `P0 开发中:Task 1 常驻规则和安装脚本已做`。

- [ ] **Step 7: 过检查,提交,推送**

```bash
G=~/.claude/skills/tech-writing-gate/scripts
F="skills/explain-ladder/always-on.md docs/superpowers/ROADMAP.md"
python3 $G/check_buzzwords.py --strict ${=F} && python3 $G/check_buzzwords.py --rules $G/jargon.tsv --strict ${=F}
bash .superpowers/sdd/2026-10-10-inkwash-p0/tools/redact.sh ${=F} skills/explain-ladder/scripts/install_always_on.sh
git add skills/explain-ladder/always-on.md skills/explain-ladder/scripts/install_always_on.sh docs/superpowers/ROADMAP.md
git commit -m "feat(explain-ladder): 常驻规则 always-on.md + install_always_on.sh(Claude Code / Codex / Gemini;自测 15 项 + 故意改坏 2 处)"
git push
```

### Task 2: autoupdate 拉完新版后刷新常驻规则(R-A4)

**Files:**
- Modify: `autoupdate/bin/do-update.sh`(补新 skill 链接那一步之后加 3 行,文件头步骤说明改一处)

**Interfaces:**
- Consumes:Task 1 的 `install_always_on.sh refresh`。
- Produces:无新接口。

- [ ] **Step 1: 改 `do-update.sh`**

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

```diff
diff --git a/autoupdate/bin/do-update.sh b/autoupdate/bin/do-update.sh
index 9cf1397..7937a58 100755
--- a/autoupdate/bin/do-update.sh
+++ b/autoupdate/bin/do-update.sh
@@ -4,7 +4,8 @@
 # 对 repos 列表里每个落后的仓:
 #   1) 工作树不干净 → 跳过(不强 pull,避免冲突)
 #   2) git pull --ff-only(只快进;分叉则停下让用户手动处理)
-#   3) 给 clone/skills/ 下的新 skill 目录在 ~/.claude/skills/ 补 symlink
+#   3) 给 clone/skills/ 下的新 skill 目录在 ~/.claude/skills/ 补 symlink;
+#      装过 explain-ladder 常驻规则的,把 Codex / Gemini 里复制进去的那一段换成新版
 #   4) 报告拉到的提交;涉及新 skill / hook 变更则提示重启 Claude Code
 #
 # 不锁 PATH:可分发工具,用使用者环境的 git。
@@ -62,6 +63,11 @@ while IFS= read -r line; do
       done
     fi
 
+    # explain-ladder 常驻规则:Codex / Gemini 那一段是复制进去的,拉完要换成新版;
+    # 没装过的不新装(refresh 只动已经装了的)
+    ao="$repo/skills/explain-ladder/scripts/install_always_on.sh"
+    if [ -f "$ao" ]; then bash "$ao" refresh | sed 's/^/  /'; fi
+
     # 改了 hook 脚本或 SKILL.md → 需重启才完全生效
     if git -C "$repo" diff --name-only "${before}..HEAD" 2>/dev/null \
          | grep -qE "autoupdate/hooks/|/SKILL\.md$"; then
```

检查:`bash -n autoupdate/bin/do-update.sh` 没有输出。

- [ ] **Step 2: 端到端实跑:假远端 → 克隆 → 装 v1 → 远端推 v2 → `do-update.sh` → AGENTS.md 换成 v2**

用临时家目录,不碰本机真配置。整段贴进一条命令跑(zsh 和 bash 都能跑):

```bash
R=<仓库根>; E=$(mktemp -d); mkdir -p $E/home/.codex
export HOME=$E/home
cd $E && git init -q --bare origin.git && git clone -q origin.git seed 2>/dev/null && cd seed \
  && mkdir -p skills/explain-ladder/scripts && cp $R/skills/explain-ladder/scripts/install_always_on.sh skills/explain-ladder/scripts/ \
  && printf 'v1 规则\n' > skills/explain-ladder/always-on.md && git add -A \
  && git -c user.name=t -c user.email=t@t commit -qm v1 && git push -q origin HEAD:main 2>/dev/null
cd $E && git clone -q -b main origin.git clone && printf 'my rule\n' > $HOME/.codex/AGENTS.md \
  && ALWAYS_ON_CLIS=codex bash clone/skills/explain-ladder/scripts/install_always_on.sh >/dev/null
cd $E/seed && printf 'v2 规则\n' > skills/explain-ladder/always-on.md \
  && git -c user.name=t -c user.email=t@t commit -qam v2 && git push -q origin HEAD:main 2>/dev/null
printf '%s\n' "$E/clone" > $E/repos
ALWAYS_ON_CLIS=codex SKYUP_REPOS=$E/repos bash $R/autoupdate/bin/do-update.sh
cat $HOME/.codex/AGENTS.md
```

预期(路径不同):

```
【clone】已更新 1 个提交：
  · v2
    …/home/.codex/AGENTS.md:常驻规则那一段换成新版
完成。
my rule

<!-- BEGIN: sky-skills explain-ladder v1 -->
v2 规则
<!-- END: sky-skills explain-ladder v1 -->
```

- [ ] **Step 3: 提交,推送**

```bash
git add autoupdate/bin/do-update.sh
git commit -m "feat(autoupdate): 拉完新版后刷新已装的 explain-ladder 常驻规则(Codex / Gemini 那一段是复制进去的)"
git push
```

### Task 3: 口味引擎补 `heard()`;anthropic 参数表;自测加 P 组(R-C1、R-C2、R-D1)

**Files:**
- Modify: `skills/design-taste/scripts/selftest.mjs`(加 P 组 + 三处故意改坏)
- Create: `skills/design-taste/assets/page-css.js`
- Create: `skills/anthropic-design/assets/taste-profile.js`
- Modify: `skills/design-taste/assets/taste-core.js`(加 `heard()` 并导出)
- Modify: `skills/design-taste/scripts/taste.mjs`(`say` 改用 `heard()`)

**Interfaces:**
- Consumes:无。
- Produces:
  - `TastePageCss.vars(table, knobs) → { '--var': '29px', … }`(只含变了的);`TastePageCss.text(map) → ':root{…}'` 或 `''`。
  - anthropic 参数表导出 `{ style: 'anthropic', KNOBS: { whitespace, pace }, CATS: {}, LEXICON, CSS, shared: { whitespace, pace }, SCENES: [], abSkip: ['pace'], apply, describe }`;
    `apply(t) → { css, cssText, knobs }`;`describe(a, req, { css: true })` 返回 `[cssText]` 或 `[]`。
  - 引擎每个风格多一个 `T.heard(annotatedEvent) → boolean`。
  - `selftest.mjs` 的 `PAGE_STYLES` 数组:P1 阶段每接一个页型风格往里加一个名字。

- [ ] **Step 1: 先写测试(P 组)**

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

```diff
diff --git a/skills/design-taste/scripts/selftest.mjs b/skills/design-taste/scripts/selftest.mjs
index 3841af1..0eac158 100644
--- a/skills/design-taste/scripts/selftest.mjs
+++ b/skills/design-taste/scripts/selftest.mjs
@@ -8,8 +8,11 @@
 //   X  across styles: words and picks made in graphite reach the shared knobs of
 //      another style, through ranges, at half weight, and nothing else moves
 //   R  reference pictures: measured empty paper within ±0.05 of the truth
+//   P  page styles (anthropic …): house taste prints no CSS; whitespace scales only the
+//      large gaps and rounds to whole px; words move the right knob; graphite's
+//      「太密」 reaches them at less than their own
 //   M  breakage: no scene step / raw values instead of ranges / full weight for
-//      other styles — each must fail its test
+//      other styles / small gaps scaled too / no rounding — each must fail its test
 import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
 import { dirname, join } from 'node:path';
 import { tmpdir } from 'node:os';
@@ -31,6 +34,23 @@ function coreFrom(src) {
   return m.exports;
 }
 
+// Load a file from source text with a given require (page profiles get a broken
+// page-css.js this way).
+function fromSrc(src, req) {
+  const m = { exports: {} };
+  new Function('module', 'exports', 'require', src)(m, m.exports, req);
+  return m.exports;
+}
+const PAGE_CSS_SRC = readFileSync(join(ASSETS, 'page-css.js'), 'utf8');
+// Page styles: their knobs are multipliers on CSS custom properties. Each one listed
+// here gets the same P tests. Add a style when its taste-profile.js is written.
+const PAGE_STYLES = ['anthropic'];
+const pageFile = name => join(HERE, `../../${name}-design/assets/taste-profile.js`);
+function pageProfile(name, cssSrc = PAGE_CSS_SRC, profSrc = readFileSync(pageFile(name), 'utf8')) {
+  const helper = fromSrc(cssSrc, () => { throw new Error('page-css.js requires nothing'); });
+  return fromSrc(profSrc, p => (/page-css\.js$/.test(p) ? helper : require(join(dirname(pageFile(name)), p))));
+}
+
 // A small ink style with two scene groups, used only here, so these tests do not
 // depend on any real style's numbers.
 const INK = {
@@ -150,6 +170,32 @@ function across(Core) {
   return res;
 }
 
+function pages(Core, broken = {}) {
+  const G = Core.create(GRAPHITE), res = [];
+  for (const name of PAGE_STYLES) {
+    const prof = pageProfile(name, broken.css, broken.prof), T = Core.create(prof);
+    const house = Object.fromEntries(Object.entries(T.KNOBS).map(([k, K]) => [k, K.def]));
+    const css = knobs => prof.describe(T.apply({ knobs: { ...house, ...knobs }, cats: {} }), null, { css: true }).join('\n');
+    res.push([`P1 ${name}: house taste prints no CSS`, css({}) === '']);
+    const out = css({ whitespace: 1.3 }), W = prof.CSS.whitespace;
+    const got = Object.fromEntries([...out.matchAll(/(--[\w-]+):([^;}]+)/g)].map(m => [m[1], m[2]]));
+    const want = Object.fromEntries(Object.entries(W.vars).map(([v, b]) => [v, Math.round(b * 1.3) + W.unit]).filter(([v, x]) => x !== W.vars[v] + W.unit));
+    const small = Object.keys(got).filter(v => W.vars[v] == null || W.vars[v] < 20);
+    res.push([`P2 ${name}: whitespace 1.3 → ${out || '(nothing)'}`, small.length === 0 && JSON.stringify(got) === JSON.stringify(want) && Object.keys(want).length > 0]);
+    const say = (E, text, n) => E.estimate(Array.from({ length: n }, () => E.annotate({ ts: iso(T0), ...E.say(text) })), T0 + DAY);
+    const own = say(T, '太密了', 2).raw.whitespace - 1;
+    const foreign = T.estimate(Array.from({ length: 2 }, () => G.annotate({ ts: iso(T0), ...G.say('太密了') })), T0 + DAY).raw.whitespace - 1;
+    res.push([`P3 ${name}: 「太密了」 said here moves whitespace ${own.toFixed(3)}, said in graphite ${foreign.toFixed(3)}`, own > 0 && foreign > 0 && foreign < own * 0.75]);
+    res.push([`P4 ${name}: 「太松了」 lowers whitespace (${say(T, '太松了', 1).knobs.whitespace})`, say(T, '太松了', 1).knobs.whitespace < 1]);
+    if (T.KNOBS.pace) res.push([`P5 ${name}: 「动画太快了」 slows the pace (${say(T, '动画太快了', 1).knobs.pace})`, say(T, '动画太快了', 1).knobs.pace > 1]);
+    if (!T.KNOBS.labelSize) {
+      const e = T.annotate({ ts: iso(T0), ...T.say('字太小了') }), g = G.estimate([e], T0 + DAY).knobs.labelSize;
+      res.push([`P6 ${name} has no label-size knob: 「字太小了」 said here is still recorded and raises graphite's (${g} > ${GRAPHITE.KNOBS.labelSize.def})`, T.heard(e) && g > GRAPHITE.KNOBS.labelSize.def]);
+    }
+  }
+  return res;
+}
+
 async function pictures() {
   const { measure, makeTestPicture } = await import('./measure.mjs');
   const { chromium } = require('playwright');
@@ -169,13 +215,20 @@ async function pictures() {
 const BREAKS = [
   { name: 'no scene step', find: 'if (!opts.scene) return base;', put: 'return base;', fails: 'S1' },
   { name: 'raw value instead of range', find: 'var x3 = K3.def + sv[n1] * (K3.max - K3.min);', put: 'var x3 = sv[n1];', fails: 'X3' },
-  { name: 'full weight for other styles', find: 'var FOREIGN = 0.5;', put: 'var FOREIGN = 1;', fails: 'X2' }
+  { name: 'full weight for other styles', find: 'var FOREIGN = 0.5;', put: 'var FOREIGN = 1;', fails: 'X2' },
+  { name: 'shared words not worth recording', find: 'parts = [e.dir, e.cat, e.sdir, e.scat]', put: 'parts = [e.dir, e.cat]', fails: 'P6' }
+];
+// Breaks in a page style's files: text in page-css.js (css) or in the first page
+// style's taste-profile.js (prof).
+const PAGE_BREAKS = [
+  { name: 'small gaps scaled too', in: 'prof', find: "'--space-5': 24", put: "'--space-4': 16, '--space-5': 24", fails: 'P2' },
+  { name: 'no rounding', in: 'css', find: 'Math.round(base * f)', put: '(base * f)', fails: 'P2' }
 ];
 
 export async function selfTest() {
   let fails = 0;
   const Core = coreFrom(CORE_SRC);
-  const groups = [['A graphite reader', graphiteReader(Core)], ['S scenes', scenes(Core)], ['X across styles', across(Core)], ['R reference pictures', await pictures()]];
+  const groups = [['A graphite reader', graphiteReader(Core)], ['S scenes', scenes(Core)], ['X across styles', across(Core)], ['P page styles', pages(Core)], ['R reference pictures', await pictures()]];
   for (const [title, rows] of groups) {
     console.log(title);
     for (const [name, ok] of rows) { if (!ok) fails++; console.log(`  ${ok ? '通过' : '失败'}  ${name}`); }
@@ -184,7 +237,16 @@ export async function selfTest() {
   for (const br of BREAKS) {
     if (!CORE_SRC.includes(br.find)) { fails++; console.log(`  失败  ${br.name}: text to break not found in taste-core.js — update BREAKS`); continue; }
     const broken = coreFrom(CORE_SRC.replace(br.find, br.put));
-    const rows = [...scenes(broken), ...across(broken)].filter(([n]) => n.startsWith(br.fails));
+    const rows = [...scenes(broken), ...across(broken), ...pages(broken)].filter(([n]) => n.startsWith(br.fails));
+    const caught = rows.length && rows.some(([, ok]) => !ok);
+    if (!caught) fails++;
+    console.log(`  ${caught ? '通过' : '失败'}  ${br.name} → ${br.fails} ${caught ? 'fails, as it must' : 'still passes: the test does not watch this'}`);
+  }
+  for (const br of PAGE_BREAKS) {
+    const src = br.in === 'css' ? PAGE_CSS_SRC : readFileSync(pageFile(PAGE_STYLES[0]), 'utf8');
+    if (!src.includes(br.find)) { fails++; console.log(`  失败  ${br.name}: text to break not found — update PAGE_BREAKS`); continue; }
+    const bad = src.replace(br.find, br.put);
+    const rows = pages(Core, br.in === 'css' ? { css: bad } : { prof: bad }).filter(([n]) => n.startsWith(br.fails));
     const caught = rows.length && rows.some(([, ok]) => !ok);
     if (!caught) fails++;
     console.log(`  ${caught ? '通过' : '失败'}  ${br.name} → ${br.fails} ${caught ? 'fails, as it must' : 'still passes: the test does not watch this'}`);
```

- [ ] **Step 2: 跑,确认失败**

Run: `node skills/design-taste/scripts/taste.mjs --self-test 2>&1 | tail -3`
Expected: 报 `ENOENT: no such file or directory, open '…/skills/design-taste/assets/page-css.js'`(还没写)。

- [ ] **Step 3: 写 `skills/design-taste/assets/page-css.js`**

```js
/* design-taste · page-css.js — for page styles (anthropic, apple …) whose taste is a
 * set of multipliers on the style's CSS custom properties.
 *
 * A page style's knob (whitespace = 1.2, say) is a factor. The style's taste-profile.js
 * lists which CSS variables the factor applies to and their house values; this file
 * multiplies, rounds to whole units and returns a :root override that the page puts
 * after the style's stylesheet. Only variables whose value changes are returned, so
 * house taste returns nothing and the page stays byte-for-byte the same.
 *
 *   var css = TastePageCss.vars({ whitespace: { unit: 'px', vars: { '--space-5': 24 } } }, { whitespace: 1.2 });
 *   TastePageCss.text(css)   // ':root{--space-5:29px}'
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TastePageCss = factory();
})(this, function () {
  'use strict';

  // table: { knob: { unit, vars: { '--name': house value } } } · knobs: { knob: factor }
  function vars(table, knobs) {
    var out = {};
    for (var k in table) {
      var f = knobs[k];
      if (f == null) continue;
      var T = table[k];
      for (var v in T.vars) {
        var base = T.vars[v], x = Math.round(base * f);
        if (x !== base) out[v] = x + T.unit;
      }
    }
    return out;
  }

  function text(map) {
    var parts = [];
    for (var v in map) parts.push(v + ':' + map[v]);
    return parts.length ? ':root{' + parts.join(';') + '}' : '';
  }

  return { vars: vars, text: text };
});
```

- [ ] **Step 4: 写 `skills/anthropic-design/assets/taste-profile.js`**

```js
/* anthropic-design · taste-profile.js — anthropic's knobs for the shared taste engine
 * (skills/design-taste/assets/taste-core.js). Both knobs are multipliers on
 * anthropic.css custom properties, turned into CSS by design-taste/assets/page-css.js.
 *
 *   whitespace  --space-5 … --space-10 (24–120px): gaps between cards, blocks, sections.
 *               --space-1 … 4 (4–16px) stay as they are: they are gaps inside one
 *               component (heading to text, button padding). Scaling them makes a
 *               component loose; it does not make the page airier.
 *   pace        --duration-sm / md / lg (240 / 400 / 700ms). Same range as graphite's
 *               pace, so a pace learnt there carries over without distortion.
 *
 * Not here: label size (anthropic.css has no font-size variables and the 78 diagram
 * SVGs write 3137 font sizes by hand), number of colours (the semantic palette is
 * fixed), theme (anthropic has one theme, light). Why: docs/superpowers/specs/
 * 2026-10-13-explain-taste-design.md §7.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../design-taste/assets/page-css.js'));
  else root.AnthropicTasteProfile = factory(root.TastePageCss);
})(this, function (PageCss) {
  'use strict';

  var KNOBS = {
    whitespace: { def: 1, min: 0.7, max: 1.5, step: 0.1,  zh: '留白(大间距倍数)', en: 'whitespace (large gaps ×)' },
    pace:       { def: 1, min: 0.5, max: 2,   step: 0.15, zh: '动画节奏(大=慢)', en: 'animation pace (big = slow)' }
  };
  // Which anthropic.css variables each knob multiplies, with their house values.
  var CSS = {
    whitespace: { unit: 'px', vars: { '--space-5': 24, '--space-6': 32, '--space-7': 48, '--space-8': 64, '--space-9': 80, '--space-10': 120 } },
    pace:       { unit: 'ms', vars: { '--duration-sm': 240, '--duration-md': 400, '--duration-lg': 700 } }
  };
  // Words a reader uses about a page -> which way the knobs move.
  var LEXICON = [
    { re: '太挤|太密|太满|太紧凑|拥挤|密密麻麻|cramped|too tight|too dense|cluttered|crowded', dir: { whitespace: 1 } },
    { re: '太松|太散|太空|空荡|页面太长|too loose|too sparse|too much space|too spread out', dir: { whitespace: -1 } },
    { re: '太快|看不过来|too fast|too quick', dir: { pace: 1 } },
    { re: '太慢|拖沓|too slow|drags', dir: { pace: -1 } }
  ];

  function apply(t) {
    var css = PageCss.vars(CSS, t.knobs);
    return { css: css, cssText: PageCss.text(css), knobs: { whitespace: t.knobs.whitespace, pace: t.knobs.pace } };
  }

  // What `design-taste/scripts/taste.mjs --style=anthropic suggest` prints.
  // --css prints only the :root line, or nothing at all for house taste.
  function describe(a, req, flags) {
    if (flags.css || flags.js) return a.cssText ? [a.cssText] : [];
    return ['draw with:',
      '  css     ' + (a.cssText || '(house values: nothing to add)'),
      '  where   the page <style>, after anthropic.css',
      '  layout  large gaps × ' + a.knobs.whitespace + ' (--space-5…10) · animation × ' + a.knobs.pace + ' (--duration-*)'];
  }

  return { style: 'anthropic', KNOBS: KNOBS, CATS: {}, LEXICON: LEXICON, CSS: CSS,
    shared: { whitespace: 'whitespace', pace: 'pace' }, SCENES: [],
    // two still screenshots cannot show animation pace
    abSkip: ['pace'],
    apply: apply, describe: describe };
});
```

- [ ] **Step 5: 跑,确认 P1–P5 通过、P6 还失败**

Run: `node skills/design-taste/scripts/taste.mjs --self-test 2>&1 | tail -5`
Expected: 最后一行是 `T.heard is not a function`(P6 调用了还没写的 `heard()`)。

- [ ] **Step 6: 引擎加 `heard()`,命令行 `say` 改用它**

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

```diff
diff --git a/skills/design-taste/assets/taste-core.js b/skills/design-taste/assets/taste-core.js
index c31dc26..2be5529 100644
--- a/skills/design-taste/assets/taste-core.js
+++ b/skills/design-taste/assets/taste-core.js
@@ -250,6 +250,15 @@
     }
     function say(text, ctx) { var p = parse(text); return stamp({ kind: 'say', dir: p.dir, cat: p.cat, note: text, hits: p.hits }, ctx); }
 
+    // Is an annotated say worth recording: words this style knows, or shared words
+    // that other styles know. 「字太小」 said in a style with no label-size knob
+    // (anthropic) still has to reach the styles that have one (graphite).
+    function heard(e) {
+      var n = 0, parts = [e.dir, e.cat, e.sdir, e.scat];
+      for (var i = 0; i < parts.length; i++) n += Object.keys(parts[i] || {}).length;
+      return n > 0;
+    }
+
     // Which knobs moved away from the house value, and the events that moved them.
     // The same list feeds the command line and the little seal on a drawing.
     function explain(t, limit) {
@@ -276,7 +285,7 @@
 
     return { style: STYLE, KNOBS: KNOBS, CATS: CATS, LEXICON: LEXICON, SHARED: SHARED, SCENES: profile.SCENES || [],
       WEIGHT: WEIGHT, PRIOR: PRIOR, WMAX: WMAX, HALF_LIFE_DAYS: HALF_LIFE_DAYS, FOREIGN: FOREIGN,
-      parse: parse, estimate: estimate, ab: ab, pick: pick, say: say, apply: apply,
+      parse: parse, estimate: estimate, ab: ab, pick: pick, say: say, heard: heard, apply: apply,
       explain: explain, annotate: annotate, stampOf: stampOf, profile: profile };
   }
 
```

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

```diff
diff --git a/skills/design-taste/scripts/taste.mjs b/skills/design-taste/scripts/taste.mjs
index 665edf7..860e56a 100644
--- a/skills/design-taste/scripts/taste.mjs
+++ b/skills/design-taste/scripts/taste.mjs
@@ -204,9 +204,13 @@ async function main() {
       append(T, [T.pick(k, +w, +l, note.join(' '))]); show(T, loadEvents(profiles, style)); return 0;
     }
     case 'say': {
-      const e = T.say(pos.slice(1).join(' '));
-      if (!Object.keys(e.dir).length && !Object.keys(e.cat).length) { console.log(`no known words in that — nothing recorded. Words it knows: ${style}'s taste-profile.js LEXICON`); return 1; }
-      append(T, [e]); console.log(`heard: ${e.hits.join(', ')} → ${fmt(e.dir)} ${Object.keys(e.cat).length ? fmt(e.cat) : ''}`); return 0;
+      const e = T.say(pos.slice(1).join(' ')), a = T.annotate(e);
+      if (!T.heard(a)) { console.log(`no known words in that — nothing recorded. Words it knows: ${style}'s taste-profile.js LEXICON and design-taste/assets/shared.js`); return 1; }
+      append(T, [e]);
+      const mine = Object.keys(e.dir).length || Object.keys(e.cat).length;
+      console.log(mine ? `heard: ${e.hits.join(', ')} → ${fmt(e.dir)} ${Object.keys(e.cat).length ? fmt(e.cat) : ''}`
+        : `heard for other styles only: ${fmt({ ...a.sdir, ...a.scat })} (${style} has no knob for it)`);
+      return 0;
     }
     case 'keep': case 'drop': {
       let knobs; try { knobs = JSON.parse(pos[1]); } catch { console.error(`usage: ${cmd} '{"knob":value}' [note]`); return 2; }
```

- [ ] **Step 7: 跑,全部通过**

Run: `node skills/design-taste/scripts/taste.mjs --self-test 2>&1 | sed -n '/^P page/,$p'`
Expected:

```
P page styles
  通过  P1 anthropic: house taste prints no CSS
  通过  P2 anthropic: whitespace 1.3 → :root{--space-5:31px;--space-6:42px;--space-7:62px;--space-8:83px;--space-9:104px;--space-10:156px}
  通过  P3 anthropic: 「太密了」 said here moves whitespace 0.116, said in graphite 0.073
  通过  P4 anthropic: 「太松了」 lowers whitespace (0.934)
  通过  P5 anthropic: 「动画太快了」 slows the pace (1.099)
  通过  P6 anthropic has no label-size knob: 「字太小了」 said here is still recorded and raises graphite's (19 > 18)
R reference pictures
  …(R1–R4 通过)
M deliberate breakage (each must fail its test)
  通过  no scene step → S1 fails, as it must
  通过  raw value instead of range → X3 fails, as it must
  通过  full weight for other styles → X2 fails, as it must
  通过  shared words not worth recording → P6 fails, as it must
  通过  small gaps scaled too → P2 fails, as it must
  通过  no rounding → P2 fails, as it must

自测:全部通过
```

- [ ] **Step 8: 命令行实跑(临时口味记录,不碰本机真的那份)**

```bash
export SKY_TASTE_DIR=$(mktemp -d)
t() { node skills/design-taste/scripts/taste.mjs "$@"; }
t styles                                     # 两行:anthropic 2 knobs、graphite 11 knobs
t --style=anthropic suggest --css | wc -c    # 0
t --style=anthropic ab                       # ask about: whitespace … A = 0.8  B = 1.2
t --style=anthropic say "页面太挤了,动画太快"  # heard: 太挤, 太快 → {"whitespace":1,"pace":1}
t --style=anthropic suggest --css            # :root{--space-5:26px;…;--space-10:128px;--duration-sm:264ms;--duration-md:440ms;--duration-lg:770ms}
t --style=anthropic say "字太小"              # heard for other styles only: {"labelSize":1} (anthropic has no knob for it)
t --style=graphite show | grep labelSize     # labelSize 19 (house 18)
t --style=anthropic say "今天天气不错"; echo $?  # no known words … 1
```

- [ ] **Step 9: graphite 的行为不能变**

```bash
node skills/graphite-design/scripts/taste.mjs --self-test 2>&1 | tail -1   # 自测:全部通过
node skills/graphite-design/scripts/build.mjs --check 2>&1 | tail -1       # up to date: 37 figures, 42 files
```

- [ ] **Step 10: 提交,推送**

```bash
bash .superpowers/sdd/2026-10-10-inkwash-p0/tools/redact.sh skills/design-taste/assets/page-css.js skills/anthropic-design/assets/taste-profile.js
git add skills/design-taste/assets/page-css.js skills/design-taste/assets/taste-core.js skills/design-taste/scripts/taste.mjs skills/design-taste/scripts/selftest.mjs skills/anthropic-design/assets/taste-profile.js
git commit -m "feat(design-taste): anthropic 接口味学习(留白、动画节奏两个倍数);共享词在没有该参数的风格里也记下(heard);自测加 P 组"
git push
```

### Task 4: 私有仓 `check_skill.mjs` 加 B9(R-D3)

**Files(私有仓 `~/claude-tools/whetstone-skills-private`):**
- Modify: `skills/design-skill-method/scripts/check_skill.mjs`(文件头说明、B9 判定、自测里两个反例)
- Modify: `skills/design-skill-method/SKILL.md`(14 → 15 项、基础档加第 0 节、版本表加 v1.3)

**Interfaces:**
- Consumes:sky-skills 里 SKILL.md 的第 0 节写法(Task 6)。
- Produces:B9 判法:去掉 front matter 后第一个 `## ` 标题是「0. 每次都做」,这一节里有
  `--style=<风格> suggest`、`--style=<风格> say`、`explain-ladder`。基础档从 8 项变 9 项。

- [ ] **Step 1: 占锁**

```bash
cd ~/claude-tools/whetstone-skills-private && git status -sb && git rev-parse HEAD
bin/repo_lock.sh acquire --why "design-skill-method v1.3:check_skill 加 B9(sky-skills explain-taste P0)"
```

- [ ] **Step 2: 改脚本(含自测里的两个反例:第 0 节不在最前面、第 0 节没写 say)**

把下面的 diff 存成 `/tmp/p.diff`,在 `~/claude-tools/whetstone-skills-private` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

````diff
--- a/skills/design-skill-method/scripts/check_skill.mjs
+++ b/skills/design-skill-method/scripts/check_skill.mjs
@@ -24,6 +24,10 @@
 //   B6 检查命令 SKILL.md 的代码块里有检查命令(check_objective / verify.py / design-review / --check / check_*.py|mjs|sh)。
 //   B7 口味     assets/taste-profile.js 存在,且 design-taste 的 `taste.mjs styles` 列出了这个风格。
 //   B8 注册     同目录 check_registration.sh 退出 0(例外清单里写了理由的算过)。
+//   B9 第 0 节  SKILL.md 去掉开头的 front matter 后,第一个 `## ` 标题是「0. 每次都做」,
+//              这一节里写到 `taste.mjs --style=<本风格> suggest`、`--style=<本风格> say` 和 `explain-ladder`。
+//              要放在最前面:长对话里后读到的步骤会被冲淡(graphite 原来把口味学习放第 6 节,
+//              读到时页面已经画完)。少了 say 就只读不记,口味永远学不到东西。
 //   F1 图例库   图例 ≥ 30 张且 ≥ 2 组。各风格图例写法不同,计数方式在 params/<仓>/gallery.tsv 里按风格声明,
 //              默认数 templates/ 下的 SVG 和 demos/<skill>/diagrams.html 里的 <figure>,取大的。
 //   F2 会动     图例或样式里有动画(@keyframes / animation: / <animate),且同一批文件里处理了 prefers-reduced-motion。
@@ -120,6 +124,16 @@
     const last = r.out.trim().split('\n').pop() || '';
     return r.code === 0 ? ['OK', last] : ['MISS', `check_registration.sh 退出 ${r.code}:${last}`];
   } },
+  { id: 'B9', tier: 'basic', what: '第 0 节「每次都做」带上口味学习和 explain-ladder', fn(c) {
+    const body = c.md.replace(/^---\n[\s\S]*?\n---\n/, '');
+    const lines = body.split('\n'), i = lines.findIndex(l => /^##\s/.test(l));
+    if (i < 0 || !/^##\s+0\.\s*每次都做/.test(lines[i])) return ['MISS', `第一个 ## 标题是「${i < 0 ? '(没有)' : lines[i].trim()}」,不是「## 0. 每次都做」`];
+    const end = lines.findIndex((l, j) => j > i && /^##\s/.test(l));
+    const sec = lines.slice(i, end < 0 ? lines.length : end).join('\n');
+    const need = [[`--style=${c.short} suggest`, '动笔前跑 suggest'], [`--style=${c.short} say`, '交付后用 say 记评价'], ['explain-ladder', '引用 explain-ladder']];
+    const miss = need.filter(([k]) => !sec.includes(k)).map(([, w]) => w);
+    return miss.length ? ['MISS', `第 0 节缺:${miss.join('、')}`] : ['OK', '在最前面,suggest / say / explain-ladder 都写了'];
+  } },
   { id: 'F1', tier: 'full', what: '图例库 ≥ 30 张且分组', fn(c) {
     const g = c.gallery;
     const svg = walk(join(c.dir, 'templates'), p => p.endsWith('.svg')).length;
@@ -213,7 +227,9 @@
 function fixture(root) {
   const w = (p, s) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), s); };
   w('skills/good-design/SKILL.md', [
-    '# good', '## 1. 定死的两样', '| 样 | 怎么做 | 没有它会怎样 |', '|---|---|---|', '| 纸 | 暖色 | 像打印 |', '| 线 | 会抖 | 像矢量图 |',
+    '---', 'name: good-design', '---', '# good',
+    '## 0. 每次都做', '跑 `taste.mjs --style=good suggest --css`;交付后 `taste.mjs --style=good say "<原话>"`;字按 explain-ladder 的 STE 写。',
+    '## 1. 定死的两样', '| 样 | 怎么做 | 没有它会怎样 |', '|---|---|---|', '| 纸 | 暖色 | 像打印 |', '| 线 | 会抖 | 像矢量图 |',
     '## 2. 放开的', '- 版式', '## 3. 场景', '先问:在哪看、读者要得到什么、动不动、有没有必须准确的东西。',
     '| 场景组 | 优先 |', '|---|---|', '| 技术图 | 准 |', '| 壁纸 | 美 |', '## 4. 谁来画', '代码画字。',
     '深色版另画,不反相。', '```bash', 'node check_objective.mjs page.html', '```'].join('\n'));
@@ -233,6 +249,9 @@
   // 定死表有,但一行没写「没有它会怎样」
   w('skills/half-design/SKILL.md', '| 样 | 怎么做 | 没有它会怎样 |\n|---|---|---|\n| 纸 | 暖色 | 像打印 |\n| 线 | 会抖 | — |\n');
   w('skills/design-taste/scripts/taste.mjs', '');
+  // 第 0 节写了,但不在最前面;另一个在最前面,但只读不记(没有 say)
+  w('skills/late-design/SKILL.md', '# late\n## 1. 定死的\n## 0. 每次都做\n`--style=late suggest` `--style=late say` explain-ladder\n');
+  w('skills/nosay-design/SKILL.md', '# nosay\n## 0. 每次都做\n`--style=nosay suggest`,字按 explain-ladder 写\n## 1. 定死的\n`--style=nosay say` 写在别的节里不算\n');
   // 深色皮肤不叫 dark:dark.tsv 声明了才认
   w('skills/skin-design/SKILL.md', '深色皮肤另画,不反相。');
   w('skills/skin-design/assets/skin.css', ':root{--p:#eee}\n:root[data-theme="ink"]{--p:#111}');
@@ -265,6 +284,8 @@
     expect('深色主题叫 ink,没声明 B5', get('plain-design').B5, 'MISS');
     const skip = checkSkill({ repo: root, name: 'good-design', render: false, run: stubRun, params }).find(r => r.id === 'F5');
     expect('不加 --render F5', skip, 'SKIP');
+    expect('第 0 节不在最前面 B9', get('late-design').B9, 'MISS');
+    expect('第 0 节没写 say(写在别的节里不算)B9', get('nosay-design').B9, 'MISS');
   } finally { rmSync(root, { recursive: true, force: true }); }
   console.log(fails.length ? `selftest: ${fails.length} 项失败` : 'selftest: 全部通过');
   return fails.length ? 1 : 0;
````

- [ ] **Step 3: 自测 + 逐项关掉的变异测试**

```bash
S=skills/design-skill-method/scripts/check_skill.mjs
node $S --selftest | tail -3        # … 第 0 节没写 say(写在别的节里不算)B9:MISS(要 MISS) / selftest: 全部通过
node $S --mutation-test | tail -1   # mutation: 15 项关掉后自测都失败
```

- [ ] **Step 4: 对 sky-skills 分支跑一次,确认 B9 在第 0 节写之前是 MISS**

```bash
for k in anthropic-design graphite-design; do node $S --repo <sky-skills 仓库根> --skill $k | grep -E 'B7|B9'; done
```

Expected:两个都是 `OK B7`、`MISS B9 … 第一个 ## 标题是「## 1. …」`。

- [ ] **Step 5: 改方法文档**

把下面的 diff 存成 `/tmp/p.diff`,在 `~/claude-tools/whetstone-skills-private` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

````diff
--- a/skills/design-skill-method/SKILL.md
+++ b/skills/design-skill-method/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: design-skill-method
-description: "做一个设计风格 skill(或按标准改造现有的)的通用方法:先找出处 → 定死几样(每样写「没有它会怎样」)→ 放开清单 → 场景四问和场景表 → 谁来画(代码 / 出图模型 / 叠用,艺术类两版择优)→ 材料文件 → 画法代码 → 图例库 → 深色另画不反相 → 口味参数表(接 design-taste)→ 展示页 → 检查 → 接入注册。两档标准(基础档人人要过、完整档按需补)和 11 个设计 skill 踩过的坑。可执行检查:scripts/check_registration.sh 逐处查一个 skill 在 sky-skills 的 29 个注册点有没有接上;scripts/check_skill.mjs 按两档标准逐项查 14 项(--all 出改造清单)。触发词:做一个新的设计 skill / 新设计风格 / 新画风 skill / 改造设计 skill / 设计 skill 标准 / 设计 skill 接入 / 注册点 / 漏接 / 两档标准 / 改造清单 / check_skill / design skill method。边界:只管怎么造和接入设计 skill,不管某个风格自己的画法(那在各风格 skill 里),不管页面审查(design-review)。"
+description: "做一个设计风格 skill(或按标准改造现有的)的通用方法:先找出处 → 定死几样(每样写「没有它会怎样」)→ 放开清单 → 场景四问和场景表 → 谁来画(代码 / 出图模型 / 叠用,艺术类两版择优)→ 材料文件 → 画法代码 → 图例库 → 深色另画不反相 → 口味参数表(接 design-taste)→ 展示页 → 检查 → 接入注册。两档标准(基础档人人要过、完整档按需补)和 11 个设计 skill 踩过的坑。可执行检查:scripts/check_registration.sh 逐处查一个 skill 在 sky-skills 的 29 个注册点有没有接上;scripts/check_skill.mjs 按两档标准逐项查 15 项(--all 出改造清单)。触发词:做一个新的设计 skill / 新设计风格 / 新画风 skill / 改造设计 skill / 设计 skill 标准 / 设计 skill 接入 / 注册点 / 漏接 / 两档标准 / 改造清单 / check_skill / design skill method。边界:只管怎么造和接入设计 skill,不管某个风格自己的画法(那在各风格 skill 里),不管页面审查(design-review)。"
 ---
 
 # 做一个设计风格 skill:通用方法
@@ -66,19 +66,19 @@
 
 | 档 | 要求 |
 |---|---|
-| 基础档(每个设计 skill 都要达到) | SKILL.md 有定死表,且每行有「没有它会怎样」;有放开清单;有场景四问和场景表;有谁来画;深色版另画的说明和 CSS 深色变量;有检查命令;有 `taste-profile.js` 且能被 `design-taste` 加载;注册点全部接上 |
+| 基础档(每个设计 skill 都要达到) | SKILL.md 有定死表,且每行有「没有它会怎样」;有放开清单;有场景四问和场景表;有谁来画;深色版另画的说明和 CSS 深色变量;有检查命令;有 `taste-profile.js` 且能被 `design-taste` 加载;注册点全部接上;SKILL.md 最前面是第 0 节「每次都做」,写到口味 `suggest` / `say` 和 `explain-ladder`(写法在 sky-skills `skills/design-taste/SKILL.md` §6 末尾) |
 | 完整档(按需补) | 图例库 ≥ 30 张且分类;有会动的图例且关掉动画完整;位图有提示词记录;有导出脚本;展示页过 `check_objective`;`build.mjs --check` 通过 |
 
 逐项检查:
 
 ```bash
 S=<本 skill 目录>/scripts/check_skill.mjs
-node $S --repo <sky-skills 仓库根> --skill graphite-design      # 一个 skill,14 项逐项列出
+node $S --repo <sky-skills 仓库根> --skill graphite-design      # 一个 skill,15 项逐项列出
 node $S --repo <仓库根> --all --render                          # 全部 *-design,基础档缺得多的排前面;--render 才跑展示页检查(F5)
-node $S --selftest && node $S --mutation-test                   # 自测;14 项判定逐个关掉,自测都必须失败
+node $S --selftest && node $S --mutation-test                   # 自测;15 项判定逐个关掉,自测都必须失败
 ```
 
-基础档 B1–B8、完整档 F1–F6,每项怎么判写在脚本文件头。判定是找关键词和文件:**写法不同就查不到**。
+基础档 B1–B9、完整档 F1–F6,每项怎么判写在脚本文件头。判定是找关键词和文件:**写法不同就查不到**。
 查不到时先看是真没写还是换了说法 —— 换了说法就把 SKILL.md 改成方法里的说法,不要放宽匹配。
 各风格图例写法不同(relief 是 `.relief-gitem`,不是 `<figure>`),F1 的数法在 `params/sky-skills/gallery.tsv` 里按风格声明;
 深色主题不叫 `dark` 的(relief 叫 `matte` / `ink`)在 `dark.tsv` 里声明。
@@ -197,4 +197,5 @@
 | v1 | 2026-10-11 | 从 sky-skills 11 个设计 skill 整理;注册点检查脚本 |
 | v1.1 | 2026-10-11 | 先判页型还是材料型,两支分开走;注册表加 match 列,宽匹配命中标 `OK?` 让人看;`--kind tool` 给非风格 skill 用;自测 19 项 |
 | v1.2 | 2026-10-11 | `check_skill.mjs` 两档 14 项逐项查,带自测和逐项改坏测试;11 个设计 skill 的改造清单;graphite 12 处例外写进清单,relief / eclat / lectern 漏的注册点补完(sky-skills `6ad4040`) |
+| v1.3 | 2026-10-13 | B9 第 0 节:每个设计 skill 最前面写「每次都做」,动笔前读口味、交付后记评价、页面文字按 STE(sky-skills explain-taste P0,设计书 `docs/superpowers/specs/2026-10-13-explain-taste-design.md`) |
 | v2 | 下一个设计 skill 做完,或改造现有 skill 时 | `check_skill.mjs`;口味参数表的具体接法(需求 R-F65)。水墨 2026-10-11 停做(user 判效果不好),做到一半学到的已收进 §3 的坑 |
````

- [ ] **Step 6: 词表,提交,推送,放锁**

```bash
G=~/.claude/skills/tech-writing-gate/scripts
python3 $G/check_buzzwords.py --strict skills/design-skill-method/SKILL.md && python3 $G/check_buzzwords.py --rules $G/jargon.tsv --strict skills/design-skill-method/SKILL.md
git add skills/design-skill-method && git commit -m "feat(design-skill-method): v1.3 B9 第 0 节「每次都做」(动笔前读口味、交付后记评价、页面文字按 STE)"
git push && bin/repo_lock.sh release
```

### Task 5: explain-ladder:默认开、常驻规则一节、加载时自查、公共文档(R-A2、R-A5、R-B3)

**Files:**
- Modify: `skills/explain-ladder/SKILL.md`(description 一句、开关一节重写、新加「常驻规则」一节、第 2 级加一条、文件表和自测清单)
- Create: `skills/explain-ladder/references/finished-pages.md`

**Interfaces:**
- Consumes:Task 1 的 `always-on.md`、`install_always_on.sh`、链接路径。
- Produces:`references/finished-pages.md`,Task 6 的第 0 节第 3 步引用它。

- [ ] **Step 1: 改 SKILL.md**

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

````diff
diff --git a/skills/explain-ladder/SKILL.md b/skills/explain-ladder/SKILL.md
index 1dea004..bb7f592 100644
--- a/skills/explain-ladder/SKILL.md
+++ b/skills/explain-ladder/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: explain-ladder
-description: "要让人看懂一件事时,先选形式再动笔。四级从便宜到贵:文字 < 图 < 网页 < 讲解视频(Karpathy 2026-10-02)。① 文字:中英文都按 ASD-STE100 打八折写(一句一事 / 写出谁做 / 一个东西一个名字 / 句子短 / 动词直接写);user 说「用 STE 讲」后每条回答都这样写,说「停止」关掉;check_ste.py 查句长、中文虚动词、英文被动、步骤里的分号、图太宽(汉字算两列)。② 图:讲关系先给图,终端里 ASCII ≤ 80 列;正式出图用设计 skill 的图例库,不够用要明说。③ 网页:看懂就扔的单文件 HTML,page_kit.py 生成(数据经 p.source / p.command 从真实文件算、页尾自动列出处、不引外部资源)+ check_page.py 四项检查(含重跑 build.py 逐字节比对)。④ 讲解视频:默认不做;AI 觉得视频明显更好时先提一句,user 点头才做(record_page.cjs 把动画页录成 webm 并核对能播、画面在动)。TRIGGER: 用 STE 讲 / STE 模式 / 简化技术英语 / ASD-STE100 / 讲得我能看懂 / 画个图讲 / 看懂就扔 / 一次性网页 / 做个网页看看 / 做个页面帮我看懂 / 可视化这份 log / log 时间线 / 可过滤的表 / 用 HTML 看 / throwaway page / 讲解视频 / 录个视频讲 / Karpathy 四招. DO NOT TRIGGER: 给别人看的成品页面(走 anthropic-design 等设计 skill)、Word / Excel 交付物、公众号配音成片(wechat-video-publisher)。"
+description: "要让人看懂一件事时,先选形式再动笔。四级从便宜到贵:文字 < 图 < 网页 < 讲解视频(Karpathy 2026-10-02)。① 文字:中英文都按 ASD-STE100 打八折写(一句一事 / 写出谁做 / 一个东西一个名字 / 句子短 / 动词直接写);默认开着,说「停止」关掉;常驻规则 always-on.md 由 install_always_on.sh 装进 Claude Code / Codex / Gemini 的全局规则,平常对话每轮都按这个写;check_ste.py 查句长、中文虚动词、英文被动、步骤里的分号、图太宽(汉字算两列)。② 图:讲关系先给图,终端里 ASCII ≤ 80 列;正式出图用设计 skill 的图例库,不够用要明说。③ 网页:看懂就扔的单文件 HTML,page_kit.py 生成(数据经 p.source / p.command 从真实文件算、页尾自动列出处、不引外部资源)+ check_page.py 四项检查(含重跑 build.py 逐字节比对)。④ 讲解视频:默认不做;AI 觉得视频明显更好时先提一句,user 点头才做(record_page.cjs 把动画页录成 webm 并核对能播、画面在动)。TRIGGER: 用 STE 讲 / STE 模式 / 简化技术英语 / ASD-STE100 / 讲得我能看懂 / 画个图讲 / 看懂就扔 / 一次性网页 / 做个网页看看 / 做个页面帮我看懂 / 可视化这份 log / log 时间线 / 可过滤的表 / 用 HTML 看 / throwaway page / 讲解视频 / 录个视频讲 / Karpathy 四招. DO NOT TRIGGER: 给别人看的成品页面(走 anthropic-design 等设计 skill)、Word / Excel 交付物、公众号配音成片(wechat-video-publisher)。"
 last-verified: 2026-10-07
 ---
 
@@ -50,16 +50,43 @@ last-verified: 2026-10-07
 
 **边界**:代码、命令、日志原文、引用不改写。改别人的旧文字时,只改自己这次动到的句子。
 
-### 开关:「用 STE 讲」
+### 开关:默认开着
 
-| user 说 | 做什么 |
+| 情况 | 做什么 |
 |---|---|
-| 「用 STE 讲」「STE 模式」 | 回一句「STE 已打开,说『停止』关掉」。之后**每条回答**都按上表写,直到关掉 |
-| 「停止」「关掉 STE」「不用 STE 了」 | 关掉,恢复平常写法 |
+| 新会话开始 | 默认开着,不用说。**每条回答**都按上表写 |
+| 「停止」「关掉 STE」「不用 STE 了」 | 回一句「STE 已关,说『用 STE 讲』重新打开」,恢复平常写法 |
 | 单说「停止」,而这时有任务在跑 | 先停任务,再问一句 STE 要不要也关 |
+| 「用 STE 讲」「STE 模式」 | 关着时重新打开,回一句「STE 已打开」;开着时照常回答 |
 
 - 开着时不变的:回答语言照旧(中文问就中文答);内容写什么、先写什么照旧,STE 只管句子怎么写。
-- 只在本次会话有效,新会话默认关着。上下文压缩后不确定开没开,看最近一次开关的话;找不到就当关着。
+- 关掉只在本次会话有效,新会话又默认开着。上下文压缩后不确定开没开,看最近一次开关的话;找不到就当开着。
+- 2026-10-13 起默认开着(user 定);以前要说「用 STE 讲」才开,新会话默认关。
+
+### 常驻规则:平常对话也默认用上
+
+skill 只在模型判断用得上时才加载,做不到每条回答都用。所以「选哪一级」和 STE 七条另有一份 22 行的
+常驻规则 `always-on.md`,装进各 CLI 的全局规则,每轮都在上下文里。例子、检查命令、第 3 级页面工具、
+第 4 级录屏留在本文件,需要时再加载。
+
+```bash
+bash <本 skill 目录>/scripts/install_always_on.sh             # 装:本机有哪个 CLI 就装哪个
+bash <本 skill 目录>/scripts/install_always_on.sh uninstall   # 卸;规则文件里别的内容不动
+bash <本 skill 目录>/scripts/install_always_on.sh --self-test # 15 项,外加故意改坏 2 处
+```
+
+| CLI | 装到哪 | 仓库更新后 |
+|---|---|---|
+| Claude Code | `~/.claude/rules/sky-skills-explain-ladder.md`,链接到 `always-on.md` | 链接指向仓库,`git pull` 后自动是新版 |
+| Codex | `~/.codex/AGENTS.md` 里带起止标记的一段 | autoupdate 的 `do-update.sh` 拉完新版后自动换;没装 autoupdate 就重跑一次安装命令 |
+| Gemini CLI | `~/.gemini/GEMINI.md` 里带起止标记的一段(还没实测过) | 同 Codex |
+
+- 2026-10-13 实测:Claude Code 2.1.296 开会话时自动加载 `~/.claude/rules/` 下的文件。更早的版本从哪一版开始支持还没查;
+  加载不到时用 `--claude-md`,改成往 `~/.claude/CLAUDE.md` 插一段。
+- 常驻规则里写明「跟用户自己的规则冲突时,以用户的规则为准」。
+
+**本 skill 被加载时先自查**:`~/.claude/rules/sky-skills-explain-ladder.md` 不在,就在回答末尾提一句
+「常驻规则没装,平常对话不会默认按 STE 写」,附上第一条安装命令。同一次会话只提一次。
 
 ### 检查
 
@@ -137,6 +164,8 @@ printf '%s' "<草稿>" | python3 $K/check_ste.py --stdin
 | 给零基础的人 | `primer-design` |
 
 - 怎么画由模型自己判断。设计 skill 可以用,不是必须用;手写 SVG 也行。
+- 反过来,每个设计 skill 的第 0 节都引用本 skill:页面上的字按 STE 写,讲关系先给图,
+  讲解类页面按 `references/finished-pages.md` 的三种做法规划。
 - **设计 skill 不够用时要明说**:缺哪种图、样式哪里不合适、为一次性页面走设计流程太重 ——
   说出来,并建议怎么补。不要硬套,也不要不声不响换成别的。
 - mermaid 之类要从 CDN 加载脚本,放进第 3 级的页面会违反「不引外部资源」;那里手写 SVG。
@@ -259,13 +288,17 @@ node $K/record_page.cjs <page.html> --seconds=30 [--size=1280x720] [--actions=st
 | `scripts/render_check.cjs` | P4 用的无头浏览器脚本;找不到 playwright 时 P4 明说跳过,不算通过 |
 | `templates/build_template.py` | `page_kit.py new` 用的骨架 |
 | `scripts/record_page.cjs` | 第 4 级:录 webm + V1 / V2 核对;`--self-test` 5 条,其中 2 条是「故意做坏,必须报」 |
+| `always-on.md` | 常驻规则原文,22 行:四级怎么选 + STE 七条 + 开关 |
+| `scripts/install_always_on.sh` | 把常驻规则装进各 CLI 的全局规则;`--self-test` 15 条,外加故意改坏 2 处 |
+| `references/finished-pages.md` | 设计 skill 做讲解页时读:让人看懂的三种做法、动画的分寸 |
 
-自测(2026-10-07 全过):
+自测(2026-10-07 全过;install_always_on.sh 2026-10-13 加):
 
 ```bash
 python3 $K/check_ste.py --self-test      # 19 通过
 python3 $K/check_page.py --self-test     # 13 通过
 node $K/record_page.cjs --self-test      # 5 通过
+bash $K/install_always_on.sh --self-test # 15 通过,故意改坏 2 处都被测出
 ```
 
 playwright 从 sky-skills 仓根目录的 `node_modules` 里找;放在别处时设 `PLAYWRIGHT_NODE_PATH`(check_page)或 `NODE_PATH`(record_page)。
````

- [ ] **Step 2: 写 `skills/explain-ladder/references/finished-pages.md`**(内容来自 anthropic、apple、glass 三份「三种做法」的共同部分)

```markdown
# 给别人看的讲解页:让人看懂的三种做法

设计 skill 做讲解页、技术介绍页时读这一份。下面是案例,不是规则:每种做法写了为什么管用、范例里看哪,
用不用、怎么改由内容决定。

来源:anthropic、apple、glass 三个设计 skill 原来各写了一份同样的表,2026-10-13 合成这一份。
只给自己看一次的网页不归这里,走 explain-ladder 第 3 级。

## 三种做法

| 做法 | 为什么管用 | 范例里看哪 |
|---|---|---|
| **首屏用动画演示机制** | 读者第一眼看到的是这个东西怎么动,不是一张抽象插画 | 首屏右侧:一条条经验被分进 L1–L4 四层,证不出来的被拒并计数 |
| **证据模块** | 页面越好看,内容越容易被当真;证据让读者能自己核对 | `#evidence`:命令输出终端、检查计数条、带规则编号的 REFUSED 票据、局限一节 |
| **读者能点选的解释器** | 自己点一下,比读三段文字快 | `#evidence` 的置信度表、`#layers` 点选岩层、`#flow` 流程步进 |

三个范例页是同一个页面(whetstone 介绍站首页)换了三种风格,版式和动画相同:

| 范例页 | 风格 |
|---|---|
| `demos/anthropic-design/explainer.html` | 暖米白底,橙色主色 |
| `demos/apple-design/explainer.html` | 白和浅灰交替,蓝色是唯一的强调色 |
| `demos/glass-design/explainer.html` | 深藏青底,极光和毛玻璃,只做了深色 |

## 动画的分寸

- 动画演示的是机制里的某一步。只是装饰的动效,能删就删。
- 示意图要注明是示意:范例 `#why` 的曲线图下面写着 "illustration, not measured data"。
- 打开「减少动态效果」时内容必须完整。`check_objective.mjs` 的 O5 查这一条。
- 动画的终态写在 markup 里:count-up 的终值写进文字;浮现前的隐藏,等 JS 跑起来再加。这样截图和检查拿到的是确定的画面。
- 讲关系的地方先给图,再写字。图要带出文字里没有的判断(explain-ladder 第 2 级)。

## 各风格自己的补充

写在各设计 skill 的 SKILL.md 里,这里不重复。例如:apple 的巨字号统计,适合「一个数字说明一件事」,数字要有出处;
glass 的动画种类多(浮现、count-up、3D tilt、path-draw),每个动画最好演示机制的一步。
```

- [ ] **Step 3: 检查**

```bash
K=skills/explain-ladder
python3 $K/scripts/check_ste.py --self-test | tail -1                                         # 自测:19 通过 / 0 失败
python3 $K/scripts/check_ste.py $K/SKILL.md $K/always-on.md $K/references/finished-pages.md   # 没有发现
G=~/.claude/skills/tech-writing-gate/scripts; F="$K/SKILL.md $K/references/finished-pages.md"
python3 $G/check_buzzwords.py --strict ${=F} && python3 $G/check_buzzwords.py --rules $G/jargon.tsv --strict ${=F}   # 0 error, 0 warn
bash ~/claude-tools/whetstone-skills-private/skills/design-skill-method/scripts/check_registration.sh --repo . --skill explain-ladder --kind tool | tail -1   # MISS 0
```

- [ ] **Step 4: 提交,推送**

```bash
git add skills/explain-ladder/SKILL.md skills/explain-ladder/references/finished-pages.md
git commit -m "feat(explain-ladder): STE 默认开;常驻规则和本 skill 的分工、加载时自查;三种做法抽成 references/finished-pages.md"
git push
```

### Task 6: anthropic、graphite 第 0 节;design-taste 写明接法(R-B1、R-B2、R-B4)

**Files:**
- Modify: `skills/anthropic-design/SKILL.md`(标题后加第 0 节;第 2 节改成两行,指向公共文档)
- Modify: `skills/graphite-design/SKILL.md`(标题后加第 0 节)
- Modify: `skills/design-taste/SKILL.md`(接了哪些风格、共享词照样记、页型风格接法、第 0 节标准写法、检查表 P 组、文件表)

**Interfaces:**
- Consumes:Task 3 的 `taste.mjs --style=anthropic suggest --css`;Task 5 的 `references/finished-pages.md`;Task 4 的 B9。
- Produces:第 0 节标准写法(在 design-taste SKILL.md §6 末尾),P1 的 9 个风格照抄。

- [ ] **Step 1: anthropic**

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

```diff
diff --git a/skills/anthropic-design/SKILL.md b/skills/anthropic-design/SKILL.md
index d821b75..be64688 100644
--- a/skills/anthropic-design/SKILL.md
+++ b/skills/anthropic-design/SKILL.md
@@ -15,6 +15,26 @@ last-verified: 2026-10-07
 现在只定死配色,其余改成指引和案例。`references/` 和 `references/canonical/` 里写的「MUST」当经验看;
 和本文件冲突时以本文件为准。
 
+## 0. 每次都做(先读这一节)
+
+本节用到两个 skill:`design-taste`(口味学习)、`explain-ladder`(讲清楚)。
+它们和本 skill 装在同一个目录下。找不到就告诉对方没装、怎么装,然后照默认值做。
+
+**动笔前**
+1. 跑 `node <本 skill 目录>/../design-taste/scripts/taste.mjs --style=anthropic suggest --css`。
+   有输出就把它放进页面的 `<style>`,排在 anthropic.css 之后。没有输出说明还没有口味记录,照默认做。
+   新写的动画时长用 `var(--duration-sm)` / `md` / `lg`,口味里的动画节奏才管得到它。
+2. 页面上的字按 STE 写:一句一件事,写出谁做,一个东西一个名字。
+   讲关系的地方先给图,图要带出文字里没有的判断。
+3. 讲解类页面按「让人看懂的三种做法」规划首屏、证据、可点选的部分:
+   `<本 skill 目录>/../explain-ladder/references/finished-pages.md`。
+
+**交给对方之后**
+4. 对方评价了(「太挤」「动画太快」),跑 `taste.mjs --style=anthropic say "<对方原话>"`。
+   在两版里挑了一版,跑 `taste.mjs --style=anthropic pick <参数> <选中的值> <没选的值> "<对方原话>"`。
+   跑过 `check_objective.mjs`,跑 `taste.mjs --style=anthropic ingest <输出文件>`。
+5. 觉得做成视频更清楚时,按 explain-ladder 第 4 级先问一句,对方点头才做。
+
 ## 1. 定死的:配色
 
 | 用途 | 颜色 |
@@ -37,20 +57,9 @@ last-verified: 2026-10-07
 
 ## 2. 让人看懂的三种做法(案例,不是规则)
 
-范例:`demos/anthropic-design/explainer.html` —— whetstone 介绍站首页换成 anthropic 配色,版式和动画原样保留。
-
-| 做法 | 为什么管用 | 范例里看哪 |
-|---|---|---|
-| **首屏用动画演示机制** | 读者第一眼看到的是这个东西怎么动,不是一张抽象插画 | 首屏右侧:一条条经验被分进 L1–L4 四层,证不出来的被拒并计数 |
-| **证据模块** | 页面越好看,内容越容易被当真;证据让读者能自己核对 | `#evidence`:命令输出终端、检查计数条、带规则编号的 REFUSED 票据、局限一节 |
-| **读者能点选的解释器** | 自己点一下,比读三段文字快 | `#evidence` 的置信度表、`#layers` 点选岩层、`#flow` 流程步进 |
-
-动画的分寸:
-
-- 示意图要注明是示意:范例 `#why` 的曲线图下面写着 "illustration, not measured data"。
-- 动画演示的是机制里的某一步。只是装饰的动效,能删就删。
-- 打开「减少动态效果」时内容必须完整(检查 O5 查这个)。
-- 讲关系的地方先给图,和全局「讲关系先给图」一致;图怎么画见下一节。
+三种做法(首屏用动画演示机制 · 证据模块 · 读者能点选的解释器)和动画的分寸,
+写在公共文档 `../explain-ladder/references/finished-pages.md`,anthropic、apple、glass 共用。
+anthropic 的范例是 `demos/anthropic-design/explainer.html`:whetstone 介绍站首页换成 anthropic 配色,版式和动画原样保留。
 
 ## 3. 图例库
 
```

- [ ] **Step 2: graphite**

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

```diff
diff --git a/skills/graphite-design/SKILL.md b/skills/graphite-design/SKILL.md
index 112e8fc..ca76ab9 100644
--- a/skills/graphite-design/SKILL.md
+++ b/skills/graphite-design/SKILL.md
@@ -13,6 +13,25 @@ last-verified: 2026-10-10
 和它借鉴的 srt-whiteboard-animation(MIT,`https://github.com/geeklee/srt-whiteboard-animation`)。
 展示页:`demos/graphite-design/index.html`;图例库 `diagrams.html`;素材 `assets.html`;短片样片 `reel.html`。
 
+## 0. 每次都做(先读这一节)
+
+本节用到两个 skill:`design-taste`(口味学习)、`explain-ladder`(讲清楚)。
+它们和本 skill 装在同一个目录下。找不到就告诉对方没装、怎么装,然后照默认值做。
+
+**动笔前**
+1. 跑 `node <本 skill 目录>/../design-taste/scripts/taste.mjs --style=graphite suggest`。
+   按输出里的 sketch / filter / css / layout 四行设参数(每行是什么见第 6 节)。没有口味记录时输出的就是默认值。
+2. 页面上的字按 STE 写:一句一件事,写出谁做,一个东西一个名字。
+   讲关系的地方先给图,图要带出文字里没有的判断。
+3. 讲解类页面按「让人看懂的三种做法」规划首屏、证据、可点选的部分:
+   `<本 skill 目录>/../explain-ladder/references/finished-pages.md`。
+
+**交给对方之后**
+4. 对方评价了(「太密」「字太小」),跑 `taste.mjs --style=graphite say "<对方原话>"`。
+   在两版里挑了一版,跑 `taste.mjs --style=graphite pick <参数> <选中的值> <没选的值> "<对方原话>"`。
+   跑过 `check_objective.mjs`,跑 `taste.mjs --style=graphite ingest <输出文件>`。
+5. 觉得做成视频更清楚时,按 explain-ladder 第 4 级先问一句,对方点头才做。
+
 ## 1. 定死的五样
 
 这五样就是这个画风。少一样就不是它了;五样都在,别的怎么做都还是它。具体色值和理由见 `references/material.md`。
```

- [ ] **Step 3: design-taste**

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

````diff
diff --git a/skills/design-taste/SKILL.md b/skills/design-taste/SKILL.md
index 730cd27..2c15b82 100644
--- a/skills/design-taste/SKILL.md
+++ b/skills/design-taste/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: design-taste
-description: "所有设计风格 skill 共用的口味学习(越用越懂你):记下这个人挑了哪张、说了什么(「字太小」「太花」)、留下或删掉了哪张、审查器查出什么、给过哪些喜欢的参考图,算出下次画图用的参数,并能逐条解释每个参数是被哪几条记录推到现在的。按场景分开记(技术图爱淡、壁纸爱浓互不干扰);在一个风格里说的「字太小」会以半份分量影响其他风格的字号;从参考图量留白和颜色数;画上留一方小印,点开看出处。各风格只写一个参数表 assets/taste-profile.js 就能接入(目前接了 graphite)。命令行 scripts/taste.mjs --style=<风格>。TRIGGER: 越用越懂你 / 口味学习 / 记住我的喜好 / 按我的口味画 / taste profile / 学我的审美 / 参考图学风格 / 这张为什么画成这样 / 新设计风格接口味学习。DO NOT TRIGGER: 页面审查打分(design-review)、某个风格具体怎么画(各风格 skill)。"
+description: "所有设计风格 skill 共用的口味学习(越用越懂你):记下这个人挑了哪张、说了什么(「字太小」「太花」)、留下或删掉了哪张、审查器查出什么、给过哪些喜欢的参考图,算出下次画图用的参数,并能逐条解释每个参数是被哪几条记录推到现在的。按场景分开记(技术图爱淡、壁纸爱浓互不干扰);在一个风格里说的「字太小」会以半份分量影响其他风格的字号;从参考图量留白和颜色数;画上留一方小印,点开看出处。各风格只写一个参数表 assets/taste-profile.js 就能接入(目前接了 graphite、anthropic);每个设计 skill 的 SKILL.md 第 0 节规定动笔前读口味、交付后记评价。命令行 scripts/taste.mjs --style=<风格>。TRIGGER: 越用越懂你 / 口味学习 / 记住我的喜好 / 按我的口味画 / taste profile / 学我的审美 / 参考图学风格 / 这张为什么画成这样 / 新设计风格接口味学习。DO NOT TRIGGER: 页面审查打分(design-review)、某个风格具体怎么画(各风格 skill)。"
 ---
 
 # design-taste:所有设计风格共用的口味学习
@@ -9,7 +9,8 @@ description: "所有设计风格 skill 共用的口味学习(越用越懂你):
 留下了这张删掉了那张、审查器说手机上字太小、拿来一张自己喜欢的画。
 这个 skill 把这些反应记进一份本机日志,下次画图前算出该用的参数;每个参数都能查到是被哪几条记录推过去的。
 
-它只管「学到什么、怎么解释」,不管怎么画:画法在各风格 skill 里(目前是 `graphite-design`)。
+它只管「学到什么、怎么解释」,不管怎么画:画法在各风格 skill 里(目前接了 `graphite-design`、`anthropic-design`)。
+什么时候用,写在每个设计 skill 的第 0 节:动笔前跑 `suggest`,交付后用 `say` / `pick` / `ingest` 记下对方的反应(§6 末尾是标准写法)。
 
 ## 1. 怎么用
 
@@ -69,6 +70,8 @@ node $T --self-test                                     # 模拟读者 + 故意
   **为什么不传原值**:graphite 留白默认 0.45,一个留白默认 0.6 的风格直接搬 0.5 过来,反而变满了。
 - 说的话分两张词表:`assets/shared.js` 里的共享词(「字太小」「太花」「太快」「深色」……)能跨风格;风格自己 `LEXICON` 里的只在本风格生效。
 - 审查器定的下限不跨风格:它是对那个风格的图查出来的。
+- 在没有某个参数的风格里说了共享词,照样记下:在 anthropic 里说「字太小」(anthropic 没有字号参数),
+  `say` 打印 `heard for other styles only`,这条记录以半份分量传给 graphite 的字号。判断写在 `taste-core.js` 的 `heard()`。
 
 ## 4. 看图识口味
 
@@ -115,6 +118,38 @@ TasteProvenance.mark(figureEl, T.explain(t), { lang: 'zh', stamp: T.stampOf(t) }
 
 然后 `node $T styles` 能看到它,`node $T --self-test` 照样全过。
 
+**页型风格**(anthropic、apple …:参数是乘在本风格 CSS 变量上的倍数):`taste-profile.js` 再导出一个 `CSS` 表,
+`{ 参数: { unit: 'px', vars: { '--space-5': 24, … } } }`,`apply()` 交给 `assets/page-css.js` 换算,
+`describe()` 在 `--css` 时只返回一行 `:root{…}`,口味全是默认值时返回空数组(页面一个字节都不变)。
+范例:`skills/anthropic-design/assets/taste-profile.js`。写好后把风格名加进 `scripts/selftest.mjs` 的 `PAGE_STYLES`,P 组测试就会测它。
+
+**最后在风格的 SKILL.md 最前面加第 0 节**,照下面写,`<风格>` 换成风格名,两处例子换成这个风格的词表认得的话。
+私有仓 `check_skill.mjs` 的 B9 查它在不在最前面、写没写 `suggest` / `say` / `explain-ladder`。
+
+```markdown
+## 0. 每次都做(先读这一节)
+
+本节用到两个 skill:`design-taste`(口味学习)、`explain-ladder`(讲清楚)。
+它们和本 skill 装在同一个目录下。找不到就告诉对方没装、怎么装,然后照默认值做。
+
+**动笔前**
+1. 跑 `node <本 skill 目录>/../design-taste/scripts/taste.mjs --style=<风格> suggest --css`。
+   有输出就把它放进页面的 `<style>`,排在本风格 CSS 之后。没有输出说明还没有口味记录,照默认做。
+2. 页面上的字按 STE 写:一句一件事,写出谁做,一个东西一个名字。
+   讲关系的地方先给图,图要带出文字里没有的判断。
+3. 讲解类页面按「让人看懂的三种做法」规划首屏、证据、可点选的部分:
+   `<本 skill 目录>/../explain-ladder/references/finished-pages.md`。
+
+**交给对方之后**
+4. 对方评价了(「太挤」「字太小」),跑 `taste.mjs --style=<风格> say "<对方原话>"`。
+   在两版里挑了一版,跑 `taste.mjs --style=<风格> pick <参数> <选中的值> <没选的值> "<对方原话>"`。
+   跑过 `check_objective.mjs`,跑 `taste.mjs --style=<风格> ingest <输出文件>`。
+5. 觉得做成视频更清楚时,按 explain-ladder 第 4 级先问一句,对方点头才做。
+```
+
+还没有参数表的风格,第 1 步会报错退出(`--style=<name> is required`)。第 0 节照样写,第 1 步改成
+「本风格还没接口味参数,跳过」;第 4 步照样记,参数表接上那天,之前的记录全部生效。
+
 ## 7. 检查
 
 ```bash
@@ -127,7 +162,8 @@ node skills/design-taste/scripts/taste.mjs --self-test
 | S | 分场景:读者 A 两组学对方向;读者 B 两组差 ≤ 1 步;没有记录的场景跟随整体口味 |
 | X | 跨风格:graphite 说「字太小」,另一个风格(自测里的 `testink`)字号变大;分量比本风格说的小;按范围换算;排线参数传不过来;下限不跨风格;主题能传 |
 | R | 参考图留白误差 ≤ 0.05;颜色数 |
-| M | 故意改坏三处(去掉场景那一步 / 跨风格直接搬原值 / 别的风格算全份),各自对应的测试必须失败 |
+| P | 页型风格(`PAGE_STYLES`,目前 anthropic):口味是默认值时不输出 CSS;留白放大只动大间距、取整到 px;本风格的词推对参数;graphite 说的「太密」传过来分量更小;没有字号参数的风格里说「字太小」照样记下、传给 graphite |
+| M | 故意改坏六处(去掉场景那一步 / 跨风格直接搬原值 / 别的风格算全份 / 共享词不算数 / 小间距也放大 / 不取整),各自对应的测试必须失败 |
 
 graphite 迁过来时另验过:300 组随机记录上,新旧两版的估计值、证据、轨迹、下一题、`apply()` 逐值相同;
 graphite「越用越懂你」3 张图重新生成后 `build.mjs --check` 无差异。
@@ -138,6 +174,7 @@ graphite「越用越懂你」3 张图重新生成后 `build.mjs --check` 无差
 assets/shared.js       五个共享参数和共享词表
 assets/taste-core.js   引擎:估计、出题、解释、跨风格换算(浏览器和命令行共用)
 assets/provenance.js   画上的小印和弹出说明
+assets/page-css.js     页型风格:倍数乘到 CSS 变量上,只输出变了的
 scripts/taste.mjs      命令行
 scripts/measure.mjs    看图识口味(playwright 读像素)
 scripts/selftest.mjs   自测
````

- [ ] **Step 4: B7、B9 都过**

```bash
S=~/claude-tools/whetstone-skills-private/skills/design-skill-method/scripts/check_skill.mjs
for k in anthropic-design graphite-design; do node $S --repo . --skill $k | grep -E 'B7|B8|B9|汇总'; done
```

Expected:两个都是 `OK B7`、`OK B8`、`OK B9 … 在最前面,suggest / say / explain-ladder 都写了`;
汇总 anthropic `基础档 4/9`,graphite `基础档 8/9`。

- [ ] **Step 5: 词表、脱敏,提交,推送**

```bash
G=~/.claude/skills/tech-writing-gate/scripts
F="skills/anthropic-design/SKILL.md skills/graphite-design/SKILL.md skills/design-taste/SKILL.md"
python3 $G/check_buzzwords.py --strict ${=F}                          # 0 error, 0 warn
python3 $G/check_buzzwords.py --rules $G/jargon.tsv --strict ${=F}    # 0 error;warn 只能是改动前就有的那 1 条(anthropic SKILL.md 第 191 行的 `幂等`)
bash .superpowers/sdd/2026-10-10-inkwash-p0/tools/redact.sh ${=F}
git add ${=F} && git commit -m "feat(anthropic, graphite): SKILL.md 加第 0 节「每次都做」;design-taste 写明页型风格接法和第 0 节标准写法"
git push
```

### Task 7: README、安装页、首页、explain-ladder 展示页(R-A6)

**Files:**
- Modify: `README_zh.md`、`README.md`(名册里 explain-ladder、design-taste 两行;安装方法后加一小节)
- Modify: `docs/INSTALL.html`(explain-ladder 那一行;§9 后加 §10)
- Modify: `demos/explain-ladder/index.html`(讲开关的 2 处)
- Modify: `site/home/build_home.py`(explain-ladder、design-taste 的介绍和相关 skill;anthropic 的相关 skill 加 design-taste)
- Regenerate: `index.html`(由 `build_home.py` 生成,不手改)

**Interfaces:** 无。

- [ ] **Step 1: 依次 apply 五份 diff**

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

````diff
diff --git a/README_zh.md b/README_zh.md
index 24d2e63..19185ec 100644
--- a/README_zh.md
+++ b/README_zh.md
@@ -55,7 +55,7 @@
 | [tech-pdf-reader](skills/tech-pdf-reader/) | ZH | **技术 PDF 阅读** —— datasheet、原理图、协议文档，答案常在时序图和引脚表里而不在文字层。按关键词定位章节、把整页渲染出来让图真的看得见、渲染失败时兜底抠内嵌图。核心纪律是把**「工具不行」**和**「文件坏了」**分开 —— 二者现象相同（都是空白），处理方式完全相反。`scripts/pdf_probe.py` 逐页报文字层 / 内嵌图数 / 有无 `/Contents`，遍历对象图区分「引用断了还能修」和「内容真的不在文件里」，再读 `Page N of M` 页脚揪出截断副本。技术参数错一位就是硬件问题，所以读不到就写读不到，绝不按「应该是这样」补全 |
 | [datasheet-reading](skills/datasheet-reading/) | EN/ZH | **在工程 PDF 里查事实** —— 寄存器某一位的定义、时序最小值、引脚从哪路供电、某个元件到底贴没贴（NC）、这份文档有没有提到 X。先定位到页，再读表或读图，答案连着页号 + 表号一起给，方便复查。硬规则：**「我没提取出来」永远不写成「文档里没有」** |
 | [hardware-3d](skills/hardware-3d/) | ZH | **写实硬件 / 芯片原理讲解页** —— 单个 HTML、手写 WebGL2、零外部依赖。PBR + 开机现烘的棚拍柔光箱环境 + SSAO + 真圆角几何；照片感来自**累积采样** —— 相机一停，每帧重新抖动亚像素偏移（高斯 σ≈0.32px）、光圈盘、柔光箱面积和 AO 核，200 帧后的软阴影和景深是真算出来的，不是糊出来的。移轴让整块板从这个角到那个角都清楚。第二层更难：**看得懂的数据流** —— 一个 64 位字是一行亮暗格子，一条总线是 64 根并行导线而不是一条线，路径画在 *die 内部*（逻辑块躺在硅上，架空铜轨在上方，那正是金属互连层的真实样子）。全部按时钟拍走，可暂停 / 单步 / 调速，读者自己数延迟有多少拍。四道可执行检查把关（自包含 / 管线 / 防霓虹回潮 / 帧时间）—— 见 [demo](demos/hardware-3d/index.html) |
-| [explain-ladder](skills/explain-ladder/) | ZH | **先选形式再动笔:文字 < 图 < 网页 < 视频**(Karpathy 2026-10-02)。文字按 ASD-STE100 打八折写 —— 一句一事、写出谁做、一个东西一个名字、句子短 —— 中英文都适用;说「用 STE 讲」本次会话打开,说「停止」关掉。`check_ste.py` 查长句、中文虚动词、英文被动、一步里做两件事、超过 80 列的图(汉字算两列)。讲关系先给图,正式出图用设计 skill 的图例库。第三级是**看懂就扔的单文件网页**:`page_kit.py` 从真实文件生成(每个数由 `build.py` 算出、页尾列出处和 sha256、不引外部资源),`check_page.py` 重跑一遍逐字节比对,手改过的数过不了。视频**默认不做**:模型提一句,user 点头才做;`record_page.cjs` 把动画页录成 webm,并核对能播、画面在动 |
+| [explain-ladder](skills/explain-ladder/) | ZH | **先选形式再动笔:文字 < 图 < 网页 < 视频**(Karpathy 2026-10-02)。文字按 ASD-STE100 打八折写 —— 一句一事、写出谁做、一个东西一个名字、句子短 —— 中英文都适用;默认开着,说「停止」本次会话关掉。`install_always_on.sh` 把 22 行常驻规则装进 Claude Code / Codex / Gemini 的全局规则,平常对话每轮都按这个写。`check_ste.py` 查长句、中文虚动词、英文被动、一步里做两件事、超过 80 列的图(汉字算两列)。讲关系先给图,正式出图用设计 skill 的图例库;设计 skill 做讲解页时读它的 `references/finished-pages.md`(让人看懂的三种做法)。第三级是**看懂就扔的单文件网页**:`page_kit.py` 从真实文件生成(每个数由 `build.py` 算出、页尾列出处和 sha256、不引外部资源),`check_page.py` 重跑一遍逐字节比对,手改过的数过不了。视频**默认不做**:模型提一句,user 点头才做;`record_page.cjs` 把动画页录成 webm,并核对能播、画面在动 |
 | [apple-design](skills/apple-design/) | EN/ZH | 以 **apple.com** 网页美学渲染 HTML/CSS —— SF Pro 字体、白/浅灰/黑交替段落、克制的文字链、巨字号统计、产品摄影主导、手工 SVG 流程图。**diagram-craft v3 (2026-06) 新增：** 内核级 SVG 制图规范（先定尺寸、tint 填充、每图 ≥2 个色相）+ 模板库扩到 30 件 —— 见[图表画廊](demos/apple-design/diagrams.html) |
 | [anthropic-design](skills/anthropic-design/) | EN/ZH | 以 **anthropic.com** 网页美学渲染 HTML/CSS —— 暖米白 + 橙色强调、Poppins 标题 + Lora 衬线正文、实心胶囊按钮、编辑式卡片、抽象 SVG 插画、低饱和图表。**v2 (2026-04) 新增：** 给 canonical 没覆盖的版式 / 控件 / 动效 / 文案各加一层 scenario recipes（dashboard / form / table / tab / accordion / modal / sidebar / changelog / video / empty-state · input / select / check / switch / toast / dialog / banner / tooltip / skeleton · hero / stagger / hover / route），加一份 `references/ux-writing.md`（CTA / empty / error / placeholder / 禁用词清单），所有 recipe class 已落到 `assets/anthropic.css`。配 `bin/design-review --audit <dir-or-url>` 批量审存量页面。**v3 (2026-05) 新增：** `scripts/` 下 4 件套 md 渲染管线 —— `md-mirror`（1 个 `.md` → 1 个 anthropic 风格 `.html`，内联 CSS）/ `md-rewrite-links`（原地 `.md`→`.html` href 替换）/ `md-pack`（把链到的 `.md` 折叠到扁平 `_md/` 子目录 + 重写 href + basename 救援源文档 `../` typo）/ `cross-link-pack`（跨目录 sibling `.html` 也折叠进同款 `_md/`）。在文档目录跑 pack + cross-link-pack 一次，`cp -r` 到任何地方所有链接全活。**diagram-craft v3 (2026-06) 新增：** 内核级 SVG 制图规范 + 模板库扩到 67 件（register-bitfield / soc-block / hw-timing-waveform / sched-timeline / interconnect-map / protocol-stack / address-map……）—— 见 [87 图画廊](demos/anthropic-design/diagrams.html) |
 | [ember-design](skills/ember-design/) | EN/ZH | 以 **手作编辑** 美学渲染 HTML/CSS —— 暖米 (#fff2df) + 深巧克力 (#312520) + 棕色 CTA (#492d22) + 金色 (#c49464)，Fraunces 展示衬线 + Inter 正文。适合咖啡工坊 / 精品酒店 / 文学期刊 / 独立品牌。**diagram-craft (2026-06) 新增：** 暖棕灰阶结构 + 金单焦点制图规范 + 8 件 SVG 图示模板 —— 见 [8 图画廊](demos/ember-design/diagrams.html) |
@@ -67,7 +67,7 @@
 | [primer-design](skills/primer-design/) | EN/ZH | 小白图解读本 —— 厚描边插画 + 比喻卡 + 术语翻译气泡，把任何主题讲到零基础也能看懂 |
 | [relief-design](skills/relief-design/) | EN/ZH | **用新拟态画技术框图** —— 深度本身就是图例：凸起是一个存在的东西，凹陷是够不到的地方、一个条件、或刻进面料的一道槽。七套皮肤（暖米白 / 中性灰 / 磨砂黑 / 墨黑 / 雾青 / 陶土 / 鼠尾草）由 `data-theme` 切换，两道检查下全部 4.5:1 达标。随附 **8 张范本页** —— [控件](skills/relief-design/references/canonical/controls.html)（四档质感，含一个故意做错的样本，加按钮 / 开关 / 滑块 / 输入框 / 分段）/ [框图](skills/relief-design/references/canonical/diagram.html)（流程链 · 树状 · 左右对比 · 分层调用 · 结构体字段）/ [硬件框图](skills/relief-design/references/canonical/hardware.html)（状态机 · 时序 · 寄存器位域 · IP 内部框图 · 内存布局 · 数据通路 · 时钟树）/ [平台框图](skills/relief-design/references/canonical/platform.html)（启动链 · 分区表 · 编号翻译 · 引脚复用 · 电源域）/ [代码框图](skills/relief-design/references/canonical/code.html)（函数堆栈及三种变体 · 调用关系 · 代码架构 · 运行调度 · 函数时序图 · 结构体指针）/ [排查框图](skills/relief-design/references/canonical/debug.html)（probe 为什么没跑 · 锁持有与死锁环 · 引用计数生命周期 · 竞态窗口 · oops 解读 · 丢失的唤醒）/ [数据结构关系](skills/relief-design/references/canonical/struct.html)（内存布局及填充空洞 · 嵌入/指针/链表三种关系 · 私有指针链 · 设备树属性到字段 —— **每张图左边都贴着它对应的源码**）/ [git 关系图](skills/relief-design/references/canonical/git.html)（分支与合并 · 仓库拓扑 · 补丁流向 · 领先与落后），另有一张 [49 张图集](demos/relief-design/diagrams.html)和一张 [flagship demo](demos/relief-design/index.html) 跟着一次触摸从玻璃走到应用。两道对比度检查缺一不可，因为它们看到的不是一回事：`check_skin_contrast.py` 查**渐变底**上的字（axe 根本算不了渐变背景），`axe-audit.mjs --theme=<皮肤>` 查真实 DOM 每个元素（脚本不扫 DOM）。**不要**用它做 aurora 玻璃（`glass-design`）、应用界面（`atelier-design`）、零基础图解（`primer-design`） |
 | [graphite-design](skills/graphite-design/) | EN/ZH | **暖纸上的石墨铅笔画风** —— [ai-doc](http://doc.tbusos.com/ai-doc/) 论文图解的那种画。定死五样:暖纸、会抖会冲出角的深灰褐石墨线、来回涂的少量彩铅、霞鹜文楷手写批注、按讲故事顺序一笔一笔画(先线后色);版式、角色、动画都自由。`assets/sketch.js` 画带种子的手绘线和彩铅排线并排好时间,`props.js` 有机器人、人物、物件、框图节点和代码卡。**37 张图例(32 张会动)**:角色 · 场景 · 电影画风 · 框图架构 · 流程图 · 代码大白话 · 数学算法 · 数据图 · 标注 · 越用越懂你,其中有傅立叶级数、拉格朗日插值和乘数、LRU 缓存、调用栈、CFS 调度、read() 在内核里的调用路径。大场景、电影画面、壁纸交给出图模型(`codex -m gpt-6-astra`,提示词和挑选记录在 `references/image-prompts.md`),图表类用代码画,[展示页](demos/graphite-design/index.html)把两者并排比较。`scripts/export.mjs` 把任意页面或图逐帧导出成 MP4 / GIF / PNG([33 秒样片](demos/graphite-design/reel.html));`scripts/taste.mjs` 按人记下挑了哪张、说了什么、审查器查出什么,下次按他的口味调参数。**不要**用它画新拟态框图(`relief-design`)或零基础图画书(`primer-design`) |
-| [design-taste](skills/design-taste/) | EN/ZH | **所有设计风格共用的口味学习** —— 挑了哪张、说了什么、留下删掉哪张、审查意见、喜欢的参考图都记进一份本机日志;每个参数是能手算核对的加权平均,按场景分开记;「字太小」这类话以半份分量传到其他风格;能从你喜欢的图里量留白和颜色数;画上一方小印点开看为什么这样画。新风格写一个 `taste-profile.js` 就能接入(目前接了 graphite)。 |
+| [design-taste](skills/design-taste/) | EN/ZH | **所有设计风格共用的口味学习** —— 挑了哪张、说了什么、留下删掉哪张、审查意见、喜欢的参考图都记进一份本机日志;每个参数是能手算核对的加权平均,按场景分开记;「字太小」这类话以半份分量传到其他风格;能从你喜欢的图里量留白和颜色数;画上一方小印点开看为什么这样画。新风格写一个 `taste-profile.js` 就能接入(目前接了 graphite、anthropic)。每个设计 skill 的第 0 节规定动笔前读口味、交付后记评价。 |
 | [design-review](skills/design-review/) | EN/ZH | **11 个设计 skill 的独立评审员** —— 四道机械检查（`verify.py` 静态 + `visual-audit.mjs` Playwright 渲染 + `axe-audit.mjs` 可达性（axe-core，color-contrast 阻断；2026-08-27 起全仓两主题实测 0 违规，见 known-bugs §6.6）+ `screenshot.mjs` 截图），外加可选 `pixel-gate.mjs` 像素回归（阈值实测校准）与 `critic.mjs` LLM 口味评审 + 仓库内已知 bug 清单。另带 `multi-critic.mjs`（4 个固定权重的专项评审员）、learning loop（critic 抓到的问题经 `design-learner` agent 固化成新的机械检查规则）、`bin/design-review` 命令行（默认跑检查链，另有 `--plan` / `--audit` / `--distill` 模式）。参考 Anthropic 的 [harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)：generator 和 evaluator 分离，reviewer 不继承 generator 的立场。完整 [9 组件 harness 路线图](docs/HARNESS-ROADMAP.html)（用十一种声音里的五种各渲一版） |
 | [gated-dual-clone](skills/gated-dual-clone/) | EN/ZH | **双仓库 git 工作流搭建器(2 仓默认 · 可选 3 仓加 reproducibility 关卡)。** 适用于上游分支受保护(必须走 MR / PR)、编译重会污染工作树的项目。一条命令创建 `gateway` 仓库(push 源) + `satellite` 仓库(只读编译树)——编译树在物理上够不到远程。搭完自动跑三道安全检查:协议墙、显式 push-URL 禁用、pre-push hook。加 `--clean-verify-dir` 启用第 3 仓(冷盘冷启动)+ stamp-match pre-push 关卡,没经从零全量编认证的 commit 推不出。完整[设计稿](docs/design-mr-gated-dual-repo.md) + [anthropic demo](demos/gated-dual-clone/index.html) |
 | [gated-dual-clone-audit](skills/gated-dual-clone-audit/) | EN/ZH | **独立评估器**,和 `gated-dual-clone` 配对。不 import 任何 generator 代码,只读成品拓扑 · 重验安全检查。四层:structural(文件系统 / hook / hardlink, 8 项) → configuration(git-config, 8 项) → behavioural(安全 `--dry-run` + 直接调 hook, 3 项) → taste(LLM critic subagent · 不阻塞 exit code)。传 `--clean-verify-dir` 自动加 4 gate(S9-S11 + C9 + B4)覆盖 3 仓拓扑。可按需跑、作 `pre-push` hook 跑、作 cron drift 检查跑。`--json` 喂给 `learning-loop` 固化野外 drift。和 `design-review` 一样的 generator / evaluator 分离原则 |
@@ -142,6 +142,22 @@ claude install github:TbusOS/sky-skills/skills/design-review
 | 二 · symlink | `git pull` 上游 = 本地跟新 | 依赖 clone 路径不动 |
 | 三 · CLI | 最少打字 · 自动识别形态 | 依赖你的 CLI 版本有 `claude install` |
 
+### 设计 skill 要一起装的两个,和一条可选的常驻规则
+
+1. **装任何设计 skill(`*-design`)时,把 `design-taste` 和 `explain-ladder` 一起装**,放在同一个目录下。
+   每个设计 skill 的第 0 节会用到它们:动笔前读你的口味,交付后记下你的评价,页面上的字按 STE 写。
+   少装了,设计 skill 会告诉你缺哪个,然后照默认值做,只是学不到你的口味。
+2. **想让平常对话也讲得清楚**,在 clone 里跑一次:
+
+   ```bash
+   bash skills/explain-ladder/scripts/install_always_on.sh             # 先看会改什么:加 --dry-run
+   bash skills/explain-ladder/scripts/install_always_on.sh uninstall   # 卸
+   ```
+
+   它把一份 22 行的常驻规则(四级怎么选 + STE 七条,默认开着,说「停止」关掉)装进本机有的 CLI:
+   Claude Code 是 `~/.claude/rules/` 下的一个链接,Codex 写进 `~/.codex/AGENTS.md`,Gemini CLI 写进 `~/.gemini/GEMINI.md`。
+   新开会话才生效。不跑这一步,只有用到设计 skill 时才按 STE 写。
+
 ## 部分 skill 详解
 
 下面详解 5 个 skill，其余的以各自 `SKILL.md` 为准：
````

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

````diff
diff --git a/README.md b/README.md
index 9c25195..ab15348 100644
--- a/README.md
+++ b/README.md
@@ -55,7 +55,7 @@ To preview locally: `python3 -m http.server 8000` from the repo root, then open
 | [tech-pdf-reader](skills/tech-pdf-reader/) | ZH | **Reading technical PDFs** — datasheets, schematics, protocol specs, where the answer sits in a timing diagram or a pin table rather than in the text layer. Locate the section by keyword, render the page so the figure is actually visible, extract embedded images when rendering fails. Its core discipline is separating **"the tool failed"** from **"the file is damaged"** — identical symptoms, opposite fixes. `scripts/pdf_probe.py` reports text layer / embedded-image count / `/Contents` per page, walks the object graph to tell a recoverable broken reference from content that is simply gone, and reads the `Page N of M` footer to catch truncated copies. A hardware parameter off by one digit is a hardware problem, so an unreadable page is reported as unreadable — never filled in from plausibility |
 | [datasheet-reading](skills/datasheet-reading/) | EN/ZH | **Fact lookup in engineering PDFs** — a register's bit definition, a timing minimum, a pin's power source, whether a part is fitted (NC), or whether the document mentions X at all. Locate the page, read the table or figure, and quote it with page + table number so the answer can be re-checked. Its hard rule is that "I could not extract it" is never reported as "the document does not say it" |
 | [hardware-3d](skills/hardware-3d/) | ZH | **Photoreal hardware / chip explainer pages** — one HTML file, hand-written WebGL2, zero external dependencies. PBR + a procedurally baked studio-softbox environment + SSAO + true rounded-box geometry; the photographic look comes from **accumulation** — park the camera and every frame re-jitters the sub-pixel offset (Gaussian σ≈0.32px), the aperture disk, the softbox area and the AO kernel, so 200 samples later the soft shadows and depth of field are real rather than blurred. Tilt-shift keeps a whole board sharp corner to corner. The second layer is the harder one: **data flow you can read** — a 64-bit word is a row of lit and dark cells, a bus is 64 parallel wires rather than one line, and the path is drawn *inside* the die (logic blocks on the silicon, elevated copper rails above them — what the metal layers actually are). Everything advances by clock ticks with pause / single-step / speed, so the reader counts the latency themselves. Four runnable checks gate it (self-contained / pipeline / anti-neon realism / frame time) — see the [demo](demos/hardware-3d/index.html) |
-| [explain-ladder](skills/explain-ladder/) | ZH | **Pick the form before you write: text < diagram < page < video** (after Karpathy, 2026-10-02). Text follows about 80% of ASD-STE100 — one idea per sentence, name who acts, one name per thing, short sentences — in Chinese as well as English; "用 STE 讲" switches it on for the session and "停止" switches it off. `check_ste.py` flags long sentences, Chinese weak verbs, English passives, two actions in one step, and diagrams wider than 80 columns (a CJK character counts as two). Relations get a diagram first; formal figures come from the design skills' libraries. The third rung is a **throwaway single-file page**: `page_kit.py` builds it from real files (every number computed by `build.py`, sources listed with sha256, no external resources), and `check_page.py` rebuilds it and compares bytes, so a hand-edited number fails. Video is **off by default**: the model proposes it in one line and waits for a yes; `record_page.cjs` records an animated page to webm and checks that it plays and that the picture actually moves |
+| [explain-ladder](skills/explain-ladder/) | ZH | **Pick the form before you write: text < diagram < page < video** (after Karpathy, 2026-10-02). Text follows about 80% of ASD-STE100 — one idea per sentence, name who acts, one name per thing, short sentences — in Chinese as well as English; on by default, "停止" switches it off for the session. `install_always_on.sh` puts a 22-line always-on rule into the global rules of Claude Code / Codex / Gemini, so ordinary answers follow it too. `check_ste.py` flags long sentences, Chinese weak verbs, English passives, two actions in one step, and diagrams wider than 80 columns (a CJK character counts as two). Relations get a diagram first; formal figures come from the design skills' libraries, and design skills read its `references/finished-pages.md` (three ways to make a page understood). The third rung is a **throwaway single-file page**: `page_kit.py` builds it from real files (every number computed by `build.py`, sources listed with sha256, no external resources), and `check_page.py` rebuilds it and compares bytes, so a hand-edited number fails. Video is **off by default**: the model proposes it in one line and waits for a yes; `record_page.cjs` records an animated page to webm and checks that it plays and that the picture actually moves |
 | [apple-design](skills/apple-design/) | EN/ZH | **apple.com palette and restraint, free layout** (reworked 2026-10-07, same approach as anthropic-design). Fixed: white / #F5F5F7 alternating, #1D1D1F text, #0066CC as the single accent, hierarchy by grey and whitespace, WCAG-checked text variants. Layout, type and motion are the model's call. Diagram library (33 SVGs, gallery) and an [`explainer.html`](demos/apple-design/explainer.html) example of the three "make it understood" patterns. Checks: `design-review/scripts/check_objective.mjs`; the MUST pipeline is optional. |
 | [anthropic-design](skills/anthropic-design/) | EN/ZH | **anthropic.com palette, free layout** (reworked 2026-10-07). Only the colours are fixed — warm cream (#faf9f5), orange (#d97757), low-saturation blue / olive / gold as semantic hues, ink text — with WCAG-checked text variants (deep orange for small text, ink on orange buttons, lighter status colours inside dark terminals). Layout, type, motion and component markup are the model's call. Ships a diagram library (78 ready SVGs, diagram-craft, gallery) and three "make it understood" patterns shown in [`explainer.html`](demos/anthropic-design/explainer.html): a hero that animates the mechanism, evidence blocks, and explainers the reader can click. `design-review/scripts/check_objective.mjs` (shared with apple / glass) checks only objective defects — JS errors, contrast, real horizontal scroll, diagram text size on phones, content with reduced motion. The old MUST pipeline (planner contract, self-diff, critic score) is now optional. |
 | [ember-design](skills/ember-design/) | EN/ZH | Render HTML/CSS in a **handcraft-editorial** aesthetic — cream (#fff2df) + chocolate (#312520) + brown CTA (#492d22) + gold accent (#c49464), Fraunces display serif + Inter body. For artisan brands, boutique hotels, literary journals. **Adds diagram-craft (2026-06):** warm-brown structure + single-gold-focus diagram rules + 8 SVG diagram templates — see the [8-figure gallery](demos/ember-design/diagrams.html) |
@@ -67,7 +67,7 @@ To preview locally: `python3 -m http.server 8000` from the repo root, then open
 | [primer-design](skills/primer-design/) | EN/ZH | ELI5 picture explainers — thick-outline illustrations, analogy cards, jargon→plain-words chips; makes any topic legible to a complete beginner |
 | [relief-design](skills/relief-design/) | EN/ZH | **Technical diagrams in neumorphism** — depth IS the legend: raised is a thing that exists, sunken is a place you cannot reach, a condition, or a channel cut into the surface. Seven skins (warm cream / neutral grey / matte black / ink / mist / clay / sage) selected by `data-theme`, all measured clean at 4.5:1 in both gate passes. Ships **8 canonical pages** — [controls](skills/relief-design/references/canonical/controls.html) (four textures including one deliberate near-miss, plus buttons / switch / slider / input / segmented) / [diagram](skills/relief-design/references/canonical/diagram.html) (pipeline · tree · before-after · call layers · struct fields) / [hardware](skills/relief-design/references/canonical/hardware.html) (state machine · timing · register bitfield · IP block diagram · memory map · data path · clock tree) / [platform](skills/relief-design/references/canonical/platform.html) (boot chain · partition layout · interrupt-number translation · pin multiplexing · power domains) / [code](skills/relief-design/references/canonical/code.html) (call stack and three variants · call graph · architecture · execution contexts · sequence diagram · pointer chain) / [debug](skills/relief-design/references/canonical/debug.html) (why probe never ran · who holds what · refcount lifetime · the race window · reading an oops · the missed wakeup) / [struct](skills/relief-design/references/canonical/struct.html) (memory layout with its padding holes · embed vs point vs link · the private-pointer round trip · device-tree property to struct field — **every figure ships the source it explains beside it**) / [git](skills/relief-design/references/canonical/git.html) (branches and merges · clone topology · where a fix travelled · ahead versus behind), plus a [flagship demo](demos/relief-design/index.html) and a [49-figure index](demos/relief-design/diagrams.html) tracing one touch from the glass to the application. Two contrast gates are both required because they see different things: `check_skin_contrast.py` reads text on GRADIENT fills, which axe cannot compute at all, and `axe-audit.mjs --theme=<skin>` reads every DOM element, which the script does not scan. **Don't** use it for aurora glass (`glass-design`), app UI (`atelier-design`), or beginner picture explainers (`primer-design`) |
 | [graphite-design](skills/graphite-design/) | EN/ZH | **Graphite pencil on warm paper** — the look of the [ai-doc](http://doc.tbusos.com/ai-doc/) paper explainers. Five things are fixed (warm paper, a warm-grey graphite line that wobbles and overshoots, a few back-and-forth coloured pencils, hand lettering in LXGW WenKai, and drawing stroke by stroke in story order — ink first, colour after); layout, cast and motion are free. `assets/sketch.js` draws seeded hand-made lines and pencil fills on a timeline; `props.js` adds a robot, people, objects, diagram nodes and a code card. **37 figures (32 animated)**: cast · scenes · cinematic · block/architecture · flowcharts · code in plain words · maths and algorithms · charts · marks · learns your taste — including Fourier series, Lagrange interpolation and multipliers, an LRU cache, a call stack, the CFS scheduler and the read() path through the kernel. Big scenes, film stills and wallpapers come from an image model (`codex -m gpt-6-astra`; prompts and picks recorded in `references/image-prompts.md`), diagrams from code — the [showcase](demos/graphite-design/index.html) puts both side by side. `scripts/export.mjs` exports any page or figure frame by frame to MP4 / GIF / PNG ([33-second sample reel](demos/graphite-design/reel.html)); `scripts/taste.mjs` keeps a per-person taste log (picks, words, reviewer findings) and tunes the next drawing to it. **Don't** use it for neumorphic diagrams (`relief-design`) or beginner picture books (`primer-design`) |
-| [design-taste](skills/design-taste/) | EN/ZH | **Taste learning shared by every design style** — records picks, words, kept / deleted figures, reviewer notes and reference pictures in one local log; estimates each knob as a weighted mean you can check by hand, per scene group; words like "labels too small" carry to other styles at half weight; measures empty space and colour from a picture you like; a small seal on each drawing explains why it looks that way. A style plugs in with one `taste-profile.js` (graphite so far). |
+| [design-taste](skills/design-taste/) | EN/ZH | **Taste learning shared by every design style** — records picks, words, kept / deleted figures, reviewer notes and reference pictures in one local log; estimates each knob as a weighted mean you can check by hand, per scene group; words like "labels too small" carry to other styles at half weight; measures empty space and colour from a picture you like; a small seal on each drawing explains why it looks that way. A style plugs in with one `taste-profile.js` (graphite and anthropic so far); section 0 of every design skill reads the taste before drawing and records the reader's reaction after. |
 | [design-review](skills/design-review/) | EN/ZH | **Independent evaluator** for the 11 design skills — gate-chain validation (`verify.py` structural + `visual-audit.mjs` Playwright-rendered + **`axe-audit.mjs` accessibility conformance (axe-core; color-contrast blocking, and as of 2026-08-27 the whole corpus measures clean in both themes — see known-bugs §6.6)** + `screenshot.mjs` + opt-in **`pixel-gate.mjs` visual regression (pixelmatch, thresholds probe-calibrated)** + `critic.mjs` LLM taste review) plus a repo-internal known-bug catalogue. Also ships `multi-critic.mjs` (4 specialist reviewers with fixed weights), a learning loop that turns critic catches into new gate rules via the `design-learner` agent, and the `bin/design-review` CLI (the default gate run, plus `--plan` / `--audit` / `--distill` modes). Inspired by Anthropic's [harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps): generator and evaluator are separate skills so the reviewer doesn't inherit the generator's assumptions. See the full [9-component harness roadmap](docs/HARNESS-ROADMAP.html) (rendered in five of the eleven voices) |
 | [gated-dual-clone](skills/gated-dual-clone/) | EN/ZH | **Dual-repo git workflow bootstrapper (2-clone default · optional 3-clone with a reproducibility gate).** For projects where the upstream branch is protected (MR / PR only) and builds are heavy / pollute the tree. One command creates a `gateway` repo (push source) and a `satellite` repo (fetch-only build tree) — the build tree is physically unable to reach the remote. Three safety gates verified post-setup: protocol wall, explicit push-URL disable, pre-push hook. Add `--clean-verify-dir` for a 3rd clone on cold disk + a stamp-match pre-push gate that refuses to push anything a from-scratch full build hasn't OK'd. Full [design spec](docs/design-mr-gated-dual-repo.md) + [anthropic demo](demos/gated-dual-clone/index.html) |
 | [gated-dual-clone-audit](skills/gated-dual-clone-audit/) | EN/ZH | **Independent evaluator** paired with `gated-dual-clone`. Imports nothing from the generator — only reads the output topology and re-verifies the safety gates. Four tiers: structural (filesystem / hook / hardlink, 8 gates) → configuration (git config, 8 gates) → behavioural (safe `--dry-run` + direct hook invocation, 3 gates) → taste (LLM critic subagent, advisory). Pass `--clean-verify-dir` to auto-add 4 more gates (S9-S11 + C9 + B4) for 3-clone topologies. Run on demand, as a `pre-push` hook, or as a cron drift check. `--json` output feeds `learning-loop` for drift codification. Same generator / evaluator split as `design-review` |
@@ -142,6 +142,22 @@ If the subcommand is not available in your version, use Method 1 or 2.
 | 2 · Symlink | `git pull` upstream = your skills update too | Relies on the clone staying put on disk |
 | 3 · CLI | Least typing · handles shape automatically | Depends on `claude install` being available in your CLI version |
 
+### Install two more with any design skill, plus an optional always-on rule
+
+1. **When you install any design skill (`*-design`), install `design-taste` and `explain-ladder` next to it** in the same directory.
+   Section 0 of every design skill uses them: it reads your taste before drawing, records your reaction after, and writes page text in STE style.
+   If one is missing, the design skill tells you which and falls back to house values; it just cannot learn your taste.
+2. **To make ordinary answers clear too**, run this once in your clone:
+
+   ```bash
+   bash skills/explain-ladder/scripts/install_always_on.sh             # add --dry-run to see what it changes
+   bash skills/explain-ladder/scripts/install_always_on.sh uninstall   # remove it
+   ```
+
+   It installs a 22-line always-on rule (pick text / diagram / page / video, plus seven STE rules; on by default, "停止" switches it off)
+   into each CLI it finds: a link under `~/.claude/rules/` for Claude Code, a marked block in `~/.codex/AGENTS.md` for Codex and in `~/.gemini/GEMINI.md` for Gemini CLI.
+   It takes effect in the next session. Without it, STE applies only when a design skill is in use.
+
 ## Selected skill details
 
 Five skills are detailed below. For the rest, each skill's own `SKILL.md` is the reference:
````

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

```diff
diff --git a/docs/INSTALL.html b/docs/INSTALL.html
index df1390f..08d445b 100644
--- a/docs/INSTALL.html
+++ b/docs/INSTALL.html
@@ -407,7 +407,7 @@ ln -s ~/sky-skills/skills/design-review .</code></pre>
           <tr>
             <td class="skill-name">explain-ladder</td>
             <td><span class="lang-en">Explain ladder: text &lt; diagram &lt; page &lt; video</span><span class="lang-zh">讲解阶梯:文字 &lt; 图 &lt; 网页 &lt; 视频</span></td>
-            <td class="skill-trigger"><span class="lang-en">"用 STE 讲" (switch on, "停止" to switch off), "explain it so I can follow", "draw the relation", "a throwaway page for this log", "make a page I can filter", "an explainer video" (proposed, made only after a yes)</span><span class="lang-zh">"用 STE 讲"(说"停止"关掉)、"讲得我能看懂"、"画个图讲"、"看懂就扔"、"做个网页看看"、"可视化这份 log"、"讲解视频"(先提,点头才做)</span></td>
+            <td class="skill-trigger"><span class="lang-en">STE writing on by default ("停止" switches it off), "explain it so I can follow", "draw the relation", "a throwaway page for this log", "make a page I can filter", "an explainer video" (proposed, made only after a yes)</span><span class="lang-zh">STE 写法默认开着(说"停止"关掉)、"讲得我能看懂"、"画个图讲"、"看懂就扔"、"做个网页看看"、"可视化这份 log"、"讲解视频"(先提,点头才做)</span></td>
           </tr>
           <tr><td colspan="3" style="background:#f0ede3; font-family:'Poppins',sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--anth-text-secondary); font-weight:600; padding:9px var(--space-4);"><span class="lang-en">Design generators · 10</span><span class="lang-zh">设计生成器 · 10</span></td></tr>
           <tr>
@@ -734,6 +734,31 @@ Update now? Say yes and I run git pull + link any new skills.</code></pre>
   </div>
 </section>
 
+<!-- §10 Clear by default -->
+<section class="anth-section" id="clear-by-default">
+  <div class="anth-container anth-container--narrow">
+    <span class="anth-badge"><span class="lang-en">10 · Learn and explain</span><span class="lang-zh">10 · 越用越懂你,讲得清楚</span></span>
+    <h2 style="margin-top:var(--space-3);">
+      <span class="lang-en">Two more skills make the design skills learn. One rule makes every answer clear.</span>
+      <span class="lang-zh">再装两个 skill,设计 skill 就会学你的口味;再装一条规则,平常回答也讲得清楚。</span>
+    </h2>
+    <p class="lang-en">Install <code>design-taste</code> and <code>explain-ladder</code> next to any design skill. Section 0 of every design skill uses them: before drawing it reads your taste, after you react it records what you said, and it writes page text in STE style. If one is missing, the design skill says so and uses house values.</p>
+    <p class="lang-zh">装任何设计 skill 时,把 <code>design-taste</code> 和 <code>explain-ladder</code> 一起装在同一个目录下。每个设计 skill 的第 0 节会用到它们:动笔前读你的口味,你评价后记下你说的话,页面上的字按 STE 写。少装了,设计 skill 会告诉你缺哪个,然后照默认值做。</p>
+<pre class="anth-code lang-en"><code># once, inside your sky-skills clone (--dry-run shows what it would change)
+bash skills/explain-ladder/scripts/install_always_on.sh
+# remove it again
+bash skills/explain-ladder/scripts/install_always_on.sh uninstall</code></pre>
+<pre class="anth-code lang-zh"><code># 在你的 sky-skills clone 里跑一次(加 --dry-run 先看会改什么)
+bash skills/explain-ladder/scripts/install_always_on.sh
+# 卸掉
+bash skills/explain-ladder/scripts/install_always_on.sh uninstall</code></pre>
+    <p style="margin-top:var(--space-5);">
+      <span class="lang-en">That installs a 22-line always-on rule: pick text, diagram, page or video, and write by seven STE rules, on by default ("停止" switches it off for the session). Claude Code gets a link under <code>~/.claude/rules/</code>; Codex and Gemini CLI get a marked block in <code>~/.codex/AGENTS.md</code> and <code>~/.gemini/GEMINI.md</code>. The auto-updater from §09 refreshes those blocks after each pull. Start a new session to pick it up.</span>
+      <span class="lang-zh">这一步装的是一份 22 行的常驻规则:先选文字、图、网页还是视频,再按 STE 七条写,默认开着(说「停止」本次会话关掉)。Claude Code 是 <code>~/.claude/rules/</code> 下的一个链接;Codex 和 Gemini CLI 是 <code>~/.codex/AGENTS.md</code>、<code>~/.gemini/GEMINI.md</code> 里带标记的一段,§09 的自动更新器每次拉完新版会把它们换成新的。新开会话才生效。</span>
+    </p>
+  </div>
+</section>
+
 <!-- Footer -->
 <footer class="anth-footer">
   <div class="anth-footer-grid">
```

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

```diff
diff --git a/demos/explain-ladder/index.html b/demos/explain-ladder/index.html
index a6d039f..6b0c81c 100644
--- a/demos/explain-ladder/index.html
+++ b/demos/explain-ladder/index.html
@@ -232,7 +232,7 @@ html.static .rung .chips { display: block; grid-column: 2 / -1; font-size: 12.5p
       <table class="tbl">
         <thead><tr><th>读者要的是</th><th>用</th><th>在哪看</th><th>这个 skill 给什么</th></tr></thead>
         <tbody>
-          <tr><td>结论、数字、一步操作</td><td><span class="lv"><i class="dot" style="background:var(--olive)"></i>1 文字</span></td><td>终端</td><td>STE 打八折的写法,「用 STE 讲」开关,<code>check_ste.py</code></td></tr>
+          <tr><td>结论、数字、一步操作</td><td><span class="lv"><i class="dot" style="background:var(--olive)"></i>1 文字</span></td><td>终端</td><td>STE 打八折的写法,默认开着,<code>check_ste.py</code></td></tr>
           <tr><td>关系:谁调用谁、哪个同步哪个、卡在哪一级、状态怎么切换</td><td><span class="lv"><i class="dot" style="background:var(--blue)"></i>2 图</span></td><td>终端(ASCII)</td><td>≤ 80 列、汉字算两列;正式出图指向设计 skill 的图例库</td></tr>
           <tr><td>一大批同类记录、一条长时间线、要过滤 / 排序 / 按行号跳</td><td><span class="lv"><i class="dot" style="background:var(--gold)"></i>3 网页</span></td><td>浏览器</td><td><code>page_kit.py</code> 生成单文件页,<code>check_page.py</code> 四项检查</td></tr>
           <tr><td>随时间展开的过程,先后顺序和时机本身就是要点</td><td><span class="lv"><i class="dot" style="background:var(--danger)"></i>4 视频</span></td><td>播放器</td><td>默认不做;先提一句,点头才用 <code>record_page.cjs</code> 录</td></tr>
@@ -259,7 +259,7 @@ html.static .rung .chips { display: block; grid-column: 2 / -1; font-size: 12.5p
           <li><div><b>一步一个动作,条件写在前面</b><span>「如果重启后没有输出,检查波特率。」</span></div></li>
           <li><div><b>不确定就直说</b><span>「应该是」→「我没查到 X,要查就跑 Y」。</span></div></li>
         </ol>
-        <p class="src">开关:说「用 STE 讲」,之后每条回答都这样写;说「停止」关掉。只在本次会话有效。</p>
+        <p class="src">开关:默认开着,每条回答都这样写;说「停止」本次会话关掉,新会话又开着。装了常驻规则(<code>install_always_on.sh</code>)的机器上,平常对话也这样写。</p>
       </div>
       <div class="rv">
         <div class="seg" role="group" aria-label="切换原文和改写">
```

把下面的 diff 存成 `/tmp/p.diff`,在 `<仓库根>` 里跑 `git apply --check /tmp/p.diff && git apply /tmp/p.diff`(`--check` 报错说明文件跟计划写的时候不一样了,先停下来看,不要硬改):

```diff
diff --git a/site/home/build_home.py b/site/home/build_home.py
index dda5b0d..5d72236 100644
--- a/site/home/build_home.py
+++ b/site/home/build_home.py
@@ -57,7 +57,7 @@ S = {
  'anthropic-design': ('des', 'An', 'anthropic', 'Voice', '风格',
    'The anthropic.com palette with a free layout: warm cream, orange, low-saturation semantic hues, ink text. 78 diagram templates and an 87-figure gallery; the check covers objective defects only.',
    '只定死 anthropic.com 的配色:暖米白、橙、低饱和语义色、墨色字,版式自由。78 张图例模板、87 图案例库;检查只查客观缺陷。',
-   DREL + ['explain-ladder'], [('demos/anthropic-design/index.html', 'Skill page', '介绍页'), ('demos/anthropic-design/explainer.html', 'Reworked example', '改版示范页'), ('demos/anthropic-design/diagrams.html', 'Diagram gallery', '图例库'), ('demos/anthropic-design/story.html', 'Earlier flagship', '旧版 flagship')]),
+   DREL + ['design-taste', 'explain-ladder'], [('demos/anthropic-design/index.html', 'Skill page', '介绍页'), ('demos/anthropic-design/explainer.html', 'Reworked example', '改版示范页'), ('demos/anthropic-design/diagrams.html', 'Diagram gallery', '图例库'), ('demos/anthropic-design/story.html', 'Earlier flagship', '旧版 flagship')]),
  'apple-design': ('des', 'Ap', 'apple', 'Voice', '风格',
    'The apple.com palette and restraint: white and light-grey sections, one blue accent, hierarchy carried by grey and whitespace. 33 diagram templates.',
    'apple.com 的配色和克制:白 / 浅灰段落交替、只有一个蓝色强调、层级靠灰阶和留白。33 张图例模板。',
@@ -139,14 +139,14 @@ S = {
    '暖纸上的石墨铅笔线、几支彩铅、手写批注,按讲故事的顺序一笔一笔画出来。37 张代码画的图例(32 张会动),场景和电影画面交给出图模型;能逐帧导出视频,还会记住你挑了哪张、慢慢调成你的口味。',
    DREL + ['design-taste', 'explain-ladder', 'wechat-video-publisher'], [('demos/graphite-design/index.html', 'Skill page', '介绍页'), ('demos/graphite-design/diagrams.html', 'Figure gallery', '图例库'), ('demos/graphite-design/reel.html', 'Sample reel', '短片样片'), ('demos/graphite-design/assets.html', 'Assets', '素材')]),
  'explain-ladder': ('sys', 'El', 'ladder', 'Explain', '讲解',
-   'Pick the form before you write: text < diagram < page < video. STE writing with an on / off switch, ASCII diagrams, throwaway pages rebuilt byte for byte, and video only after a yes.',
-   '先选形式再动笔:文字 < 图 < 网页 < 视频。STE 写法带开关、ASCII 图、能逐字节重建的看懂就扔页,视频要点头才做。',
+   'Pick the form before you write: text < diagram < page < video. STE writing on by default (an always-on rule for Claude Code, Codex and Gemini), ASCII diagrams, throwaway pages rebuilt byte for byte, and video only after a yes.',
+   '先选形式再动笔:文字 < 图 < 网页 < 视频。STE 写法默认开着(常驻规则可装进 Claude Code / Codex / Gemini)、ASCII 图、能逐字节重建的看懂就扔页,视频要点头才做。',
    ['wechat-video-publisher', 'anthropic-design', 'apple-design', 'glass-design', 'relief-design', 'primer-design'],
    [('demos/explain-ladder/index.html', 'Demo', 'Demo')]),
  'design-taste': ('har', 'Ta', 'taste', 'Taste', '口味',
-   'Taste learning shared by every design style: picks, words, kept and deleted figures, reviewer notes and reference pictures go into one local log; each knob is a weighted mean you can check by hand, and every value can show which records moved it. A style plugs in with one taste-profile.js.',
-   '所有设计风格共用的口味学习:挑了哪张、说了什么、留下删掉了哪张、审查意见、喜欢的参考图,记进一份本机日志;每个参数是能手算核对的加权平均,还能查到是被哪几条记录推过去的。新风格写一个 taste-profile.js 就能接入。',
-   ['graphite-design', 'design-review'], [('https://github.com/TbusOS/sky-skills/blob/main/skills/design-taste/SKILL.md', 'SKILL.md', 'SKILL.md')]),
+   'Taste learning shared by every design style: picks, words, kept and deleted figures, reviewer notes and reference pictures go into one local log; each knob is a weighted mean you can check by hand, and every value can show which records moved it. A style plugs in with one taste-profile.js; graphite and anthropic so far.',
+   '所有设计风格共用的口味学习:挑了哪张、说了什么、留下删掉了哪张、审查意见、喜欢的参考图,记进一份本机日志;每个参数是能手算核对的加权平均,还能查到是被哪几条记录推过去的。新风格写一个 taste-profile.js 就能接入,目前接了 graphite、anthropic。',
+   ['graphite-design', 'anthropic-design', 'design-review'], [('https://github.com/TbusOS/sky-skills/blob/main/skills/design-taste/SKILL.md', 'SKILL.md', 'SKILL.md')]),
 }
 
 
```

- [ ] **Step 2: 重新生成首页**

```bash
python3 site/home/build_home.py && python3 site/home/build_home.py --check | tail -1   # index.html 和重新生成的结果逐字节相同
```

- [ ] **Step 3: 检查**

```bash
node skills/design-review/scripts/facts.mjs --strict 2>&1 | tail -1                              # ✓ facts clean
node skills/design-review/scripts/check_objective.mjs docs/INSTALL.html demos/explain-ladder/index.html 2>&1 | grep '通过 /'
#   两行都是 6 通过 / 0 失败 / 0 提醒(走代理的机器第一次要下字体,每页 20–60 秒)
G=~/.claude/skills/tech-writing-gate/scripts
F="README.md README_zh.md docs/INSTALL.html demos/explain-ladder/index.html"
python3 $G/check_buzzwords.py --strict ${=F}                          # 0 error, 0 warn
python3 $G/check_buzzwords.py --rules $G/jargon.tsv --strict ${=F}    # 0 error;warn 跟改动前一样多(main 上这 4 个文件 13 条)
bash .superpowers/sdd/2026-10-10-inkwash-p0/tools/redact.sh ${=F} site/home/build_home.py index.html
bash skills/design-review/scripts/design_md_selftest.sh 2>&1 | tail -1   # 42 passed, 1 failed(改动前就是这样,不是这次引入的)
```

- [ ] **Step 4: 提交,推送**

```bash
git add README.md README_zh.md docs/INSTALL.html demos/explain-ladder/index.html site/home/build_home.py index.html
git commit -m "docs: 安装说明加 design-taste / explain-ladder 一起装和常驻规则;STE 默认开、design-taste 接了 anthropic 的说法同步到 README、安装页、首页"
git push
```

### Task 8: 留白 A/B 实验(R-C3)

**Files:** 不改仓库。两版页面和截图放临时目录。

**Interfaces:**
- Consumes:Task 3 的 anthropic 参数表 `apply()`。
- Produces:user 本机口味记录里一条 `pick whitespace …`。

- [ ] **Step 1: 生成两版**(`</head>` 前插入覆盖值;CSS 路径改成绝对路径,页面放哪都能打开)

```bash
R=<仓库根>; OUT=$(mktemp -d)/ab; mkdir -p $OUT
node -e '
const fs=require("fs"),path=require("path");
const [repo,out]=process.argv.slice(1);
const prof=require(repo+"/skills/anthropic-design/assets/taste-profile.js");
const src=fs.readFileSync(repo+"/demos/anthropic-design/one-bit.html","utf8").split("../../skills/").join("file://"+repo+"/skills/");
for (const w of [0.8,1.2]) {
  const css=prof.apply({knobs:{whitespace:w,pace:1}}).cssText;
  fs.writeFileSync(path.join(out,"one-bit-"+w+".html"), src.replace("</head>","<style>"+css+"</style>\n</head>"));
  console.log(w, css);
}' "$R" "$OUT"
```

Expected:

```
0.8 :root{--space-5:19px;--space-6:26px;--space-7:38px;--space-8:51px;--space-9:64px;--space-10:96px}
1.2 :root{--space-5:29px;--space-6:38px;--space-7:58px;--space-8:77px;--space-9:96px;--space-10:144px}
```

- [ ] **Step 2: 量页高、截全页图,两版各跑客观检查**

```bash
cd <仓库根> && node -e '
const { chromium } = require("playwright");
(async () => {
  const [O] = process.argv.slice(1);
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const f of ["demos/anthropic-design/one-bit.html", O+"/one-bit-0.8.html", O+"/one-bit-1.2.html"]) {
    await p.goto("file://"+require("path").resolve(f), { waitUntil: "load", timeout: 60000 });
    console.log(f.split("/").pop(), "页高", await p.evaluate(() => document.documentElement.scrollHeight));
    await p.screenshot({ path: O+"/"+f.split("/").pop().replace(".html",".png"), fullPage: true });
  }
  await b.close();
})();' "$OUT"
node skills/design-review/scripts/check_objective.mjs $OUT/one-bit-0.8.html $OUT/one-bit-1.2.html 2>&1 | grep '通过 /'
```

Expected:页高约 5827 / 5506 / 6149;两版都是 `5 通过 / 0 失败 / 1 提醒`
(O6 那 1 条提醒是示范页 SVG 旧配色里 51 处字的对比度,两版相同,跟间距无关)。

- [ ] **Step 3: 给 user 看,等 user 挑**

用 `open $OUT/one-bit-0.8.html $OUT/one-bit-1.2.html` 打开两版(或者给截图路径)。告诉 user 两版只差大间距
(`--space-10` 96px 对 144px,整页高度差约 640px),问哪版更好、为什么。**user 回答之前不往下走。**

- [ ] **Step 4: 记进 user 的口味记录**(本机真的那份 `~/.config/sky-skills/taste.jsonl`)

```bash
node skills/design-taste/scripts/taste.mjs --style=anthropic pick whitespace <选中的值> <没选的值> "<user 原话>"
node skills/design-taste/scripts/taste.mjs --style=anthropic explain whitespace
```

Expected:`explain` 列出刚才这一条 pick,whitespace 往选中的那边移了。

### Task 9: 验收,ROADMAP,开 PR

**Files:**
- Modify: `docs/superpowers/ROADMAP.md`
- 私有仓 `skills/design-skill-method/SKILL.md` §2 的改造清单表(重跑后整张换掉)

- [ ] **Step 1: 问 user 要不要在本机装常驻规则**。点头后:

```bash
bash skills/explain-ladder/scripts/install_always_on.sh --dry-run   # 先给 user 看会改哪几处
bash skills/explain-ladder/scripts/install_always_on.sh
ls -la ~/.claude/rules/sky-skills-explain-ladder.md                  # 链接指向仓库里的 always-on.md
```

- [ ] **Step 2: 人工验收(请 user 新开一个会话做)**

| # | 怎么做 | 通过的标志 |
|---|---|---|
| A1 | 不说任何关键词,问一个技术问题 | 回答一句一件事、写出谁做;讲调用关系时先给一张 ≤ 80 列的 ASCII 图 |
| A2 | 说「停止」 | 回「STE 已关」,之后恢复平常写法 |
| A3 | 让 AI 跑一个长命令,跑的时候说「停止」 | 先停命令,再问 STE 要不要也关(Review Focus 第 5 条) |
| A4 | 「用 anthropic 风格做一个讲 X 的页面」 | AI 自己跑了 `taste.mjs --style=anthropic suggest --css`,并把输出放进页面(user 挑过 A/B,所以输出不为空) |
| A5 | 对 A4 的页面说「太挤了」 | AI 自己跑了 `taste.mjs --style=anthropic say "太挤了"` |
| A6 | 「用石墨风画一张 Y 的图」 | AI 自己跑了 `taste.mjs --style=graphite suggest` |

有哪一条不过,记下 AI 实际做了什么,回到对应任务改措辞,不要放宽这张表。

- [ ] **Step 3: 全量自测再跑一遍**

```bash
node skills/design-taste/scripts/taste.mjs --self-test 2>&1 | tail -1                    # 自测:全部通过
bash skills/explain-ladder/scripts/install_always_on.sh --self-test | tail -1            # 自测:全部通过
node skills/graphite-design/scripts/taste.mjs --self-test 2>&1 | tail -1                 # 自测:全部通过
node skills/graphite-design/scripts/build.mjs --check 2>&1 | tail -1                     # up to date: 37 figures, 42 files
python3 site/home/build_home.py --check | tail -1                                        # 逐字节相同
node skills/design-review/scripts/facts.mjs --strict 2>&1 | tail -1                      # ✓ facts clean
```

- [ ] **Step 4: 重跑改造清单,换掉私有仓方法 §2 那张表**

```bash
node ~/claude-tools/whetstone-skills-private/skills/design-skill-method/scripts/check_skill.mjs --repo . --all --render
```

Expected:anthropic、graphite 的 B9 通过;其余 9 个 B9 都是 MISS(P1 做)。
占锁 → 把输出的表换进 §2,表前的说明改成「2026-10-13 在 sky-skills `<这次的 HEAD>` 上全跑」→ 提交、推送、放锁。

- [ ] **Step 5: ROADMAP**

「当前阶段」改成 `P0 做完,PR 待 user 确认合并`;加一行「P0 结果」:列出 A/B 挑了哪版、A1–A6 哪几条过了、改造清单的变化;
「下一步」写 P1(其余 9 个风格的第 0 节,6 个页型风格的参数表,apple / glass 第 2 节改指向公共文档)。
过词表和脱敏后提交、推送。

- [ ] **Step 6: 开 PR**(合并由 user 确认)

```bash
git log --oneline main..HEAD
gh pr create --base main --head feat/explain-taste --title "explain-taste P0:常驻规则 STE 默认开 + anthropic / graphite 第 0 节和口味学习" --body-file <写好的说明>
```

PR 说明写:做了什么(按需求编号)、为什么、验收结果(A1–A6 和各自测数字)、两处会往「放过」坏的地方
(没跑安装命令时平常对话不按 STE 写、Codex / Gemini 那一段要靠 `do-update.sh` 刷新)、没实测的(Gemini)。
说明末尾按工具提示加 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`;提交信息里不加署名。

---

## 需求对照

| 需求 | 任务 |
|---|---|
| R-A1 常驻规则 ≤ 25 行 | Task 1 Step 2 |
| R-A2 STE 默认开 | Task 1 Step 2(规则原文)、Task 5 Step 1(SKILL.md 开关一节) |
| R-A3 安装命令 | Task 1 Step 3–5 |
| R-A4 do-update 刷新 | Task 2 |
| R-A5 explain-ladder SKILL.md | Task 5 |
| R-A6 README / INSTALL | Task 7 |
| R-B1 第 0 节(anthropic、graphite) | Task 6 Step 1–2 |
| R-B2 没装时怎么办 | Task 6(第 0 节第二句) |
| R-B3 公共文档 + anthropic 指向它 | Task 5 Step 2、Task 6 Step 1 |
| R-B4 标准写法放进 design-taste | Task 6 Step 3 |
| R-C1 anthropic 参数表 | Task 3 Step 4 |
| R-C2 `suggest --css`,默认为空 | Task 3 Step 4、Step 8 |
| R-C3 A/B 实验 | Task 8 |
| R-D1 自测 P 组 + 故意改坏 | Task 3 |
| R-D2 安装命令自测 | Task 1 Step 4 |
| R-D3 B9 | Task 4 |
| R-N1–N5 | Global Constraints;每个任务的检查步骤 |

需求里 P1、P2 的条目(R-B1 其余 9 个、R-B3 apple / glass、R-C4、R-C5)不在本计划。
