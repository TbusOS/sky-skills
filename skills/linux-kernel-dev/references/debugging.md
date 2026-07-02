# Kernel Debugging

> 权威源：`Documentation/admin-guide/`、`Documentation/dev-tools/`（ftrace、kgdb、kasan 等）；
> drgn 见 <https://drgn.readthedocs.io/>；trace-cmd 见 <https://trace-cmd.org/>。
> drgn / trace-cmd 两节的实战要点提炼自内核 maintainer 的 agent 工作流仓
> [chucklever/cel-kdev](https://github.com/chucklever/cel-kdev)。
> 硬件状态调试：**直接读字节**，别从软件观察推硬件（见 `bsp_discipline.md`）。

## Logging

```c
/* 有 struct device 时优先 dev_* */
dev_err(dev,  "failed to init: %d\n", ret);
dev_warn(dev, "unexpected state: 0x%08x\n", val);
dev_info(dev, "device ready, version %d.%d\n", major, minor);
dev_dbg(dev,  "reg dump: 0x%x = 0x%08x\n", offset, val);

/* 无 struct device（早期启动 / 核心代码） */
pr_err("critical failure\n");
pr_info("subsystem initialized\n");

/* 动态调试（运行时开） */
/* echo 'file my_driver.c +p' > /sys/kernel/debug/dynamic_debug/control */
```

## Tools

| 工具 | 用法 | 用途 |
|---|---|---|
| `dmesg` | `dmesg -wH` | 内核日志（跟随） |
| `ftrace` | `/sys/kernel/debug/tracing/` | 函数跟踪 |
| `kprobe` | `echo 'p:my my_func' > kprobe_events` | 动态探针 |
| `perf` | `perf top -g` | 性能剖析 |
| `crash`/`kdump` | 分析 vmcore | 事后崩溃分析 |
| `gdb`+QEMU | `gdb vmlinux` | 源码级调试 |
| `drgn` | `sudo drgn -k` | 活体内核数据结构检查（见下节） |
| `trace-cmd` | `trace-cmd record/report` | ftrace 抓包 + 离线分析（见下节） |
| `/proc`、`/sys` | `cat /proc/interrupts` | 运行时检视 |
| `devmem` | `devmem 0x10000000` | 裸内存/寄存器读 |

## ftrace quick start

```bash
echo function > /sys/kernel/debug/tracing/current_tracer
echo my_driver_probe > /sys/kernel/debug/tracing/set_ftrace_filter
echo 1 > /sys/kernel/debug/tracing/tracing_on
cat /sys/kernel/debug/tracing/trace

# 调用树
echo function_graph > /sys/kernel/debug/tracing/current_tracer
echo my_driver_* > /sys/kernel/debug/tracing/set_graph_function
```

## drgn 活体内核检查

诊断挂死、核对数据结构内容、追引用计数、看队列状态——不用 kdump，直接透过
`/proc/kcore` 读运行中的内核。全程需要 root。

```bash
sudo drgn -k                                  # 交互式；-k 自动解符号
sudo drgn -k -c 'print(prog["jiffies"])'      # 一次性命令
sudo drgn -k /path/to/script.py               # 多行逻辑写成脚本再跑
# 别用 -c /proc/kcore -e vmlinux —— -e 会被当 inline Python 解析
# 符号走 debuginfod 时 sudo 会剥掉环境变量,要转发:
sudo DEBUGINFOD_URLS="$DEBUGINFOD_URLS" drgn -k script.py
```

脚本核心模式：

```python
from drgn import Object, cast
from drgn.helpers.linux.pid import find_task
from drgn.helpers.linux.list import container_of
from drgn.helpers.linux.percpu import per_cpu_ptr

obj = Object(prog, 'struct kioctx', address=addr)   # 裸地址 → 有类型对象
print(hex(task.tk_client.value_()))                 # 指针取地址用 .value_(),直接 print 会 dump 整个 struct
rdma = container_of(xprt, 'struct rpcrdma_xprt', 'rx_xprt')  # 内嵌 struct 用 container_of,别硬 cast
rq = per_cpu_ptr(prog['runqueues'], cpu)            # per-cpu 变量必须过 per_cpu_ptr

# 字段名跨版本会改 —— 访问陌生字段前先自省成员再动手
members = {m.name for m in obj.type_.type.members if m.name}

task = find_task(prog, pid)
print(prog.stack_trace(task))                       # 栈帧局部变量用 frame['name'],不是 frame.locals()
```

坑速查：

| 症状 | 原因 | 修法 |
|---|---|---|
| `ObjectNotFoundError`（sudo 下） | debuginfod 环境变量被剥 | 转发 `DEBUGINFOD_URLS` 或 `sudo -E` |
| `AttributeError` 访问字段 | 字段跨版本改名 | 先自省 members 再取 |
| 输出巨大刷屏 | print 了 struct 指针 | 用 `.value_()` 取地址 |
| per-cpu 值不对 | 没加 per-cpu 偏移 | 走 `per_cpu_ptr()` |
| `.refs.counter` 报错 | `atomic_long_t` 直接是 `.counter` | `refcount_t` 才是 `.refs.counter` |
| slab 遍历挂住 | 活体遍历极慢 | `sudo timeout 60 drgn ...`，优先定向查找（引用计数/链表/`/sys/kernel/slab/` 统计） |

脚本习惯：在脚本内先过滤再输出（别 dump 全量回来 grep）；「探布局」和「读值」合进
一个脚本（少一次启动开销）。

## trace-cmd 抓包分析

分析 `trace-cmd record` 抓的 `.dat` 文件，支撑「改 patch → 测量 → 分析」循环。
报文是二进制流，`trace-cmd report` 输出走管道用 awk/grep 提字段是正解。

```bash
trace-cmd report -i trace.dat -F 'event_name'   # -i 必须在 -F 之前,顺序错了文件名会被当过滤器
trace-cmd report -i trace.dat --stat            # 先看统计再分析
```

`--stat` 必查两件事：

1. **丢包**：overrun / dropped 任一非零 → 抓包不完整，占比和事件配对都不可信，
   建议 `trace-cmd record -b <更大缓冲>` 重录。
2. **时钟**：默认 `local` 时钟是 per-CPU 不同步的，跨 CPU 时间差不可信；
   跨 CPU 配对（如 A 核 enqueue、B 核 dequeue 算延迟）要 `-C global` / `-C mono` 录。

字段提取套路：

```bash
# report 的 header 走 stderr,某些版本事件行也混 stderr → 统一 2>&1 再 grep 事件名存临时文件
trace-cmd report -i trace.dat -F 'my_event' 2>&1 | grep my_event > my_event.txt

# key=value 提取 + 分布统计（min/p50/p90/p99/max/mean）
awk '{for(i=1;i<=NF;i++) if($i ~ /^execute-us=/){split($i,a,"="); print a[2]}}' my_event.txt | \
  sort -n | awk '{a[NR]=$1; s+=$1} END{n=NR;
    printf "n=%d min=%d p50=%d p90=%d p99=%d max=%d mean=%.0f\n",
      n, a[1], a[int(n*0.5)], a[int(n*0.9)], a[int(n*0.99)], a[n], s/n}'
```

坑速查：

| 症状 | 原因 | 修法 |
|---|---|---|
| `-F` 过滤静默不命中 | 过滤字段名要用 format 定义里的全名，不是 report 里的缩写标签 | `trace-cmd dump -i file --events` 查真实字段名 |
| `grep -oP` 大文件管道零输出 | 宽字符类 pattern（`\S+`）在 10 万行级管道上静默失效 | 用 awk 提字段 |
| 跨 CPU 延迟异常 | `local` 时钟不同步 | 重录用 `-C global` |
| 事件配对对不上 | 有 overrun 丢包 | 先看 `--stat`，加大 `-b` 重录 |

## Oops / panic triage

```
1. 用 addr2line / scripts/faddr2line 解调用栈
2. 判断 oops 在内核还是模块
3. 模块 → 查指针生命周期 / 稳定符号使用
4. 内核 → 上报上游，别本地乱 patch

aarch64-linux-gnu-addr2line -e vmlinux <hex_address>
scripts/faddr2line vmlinux my_function+0x1c
```
