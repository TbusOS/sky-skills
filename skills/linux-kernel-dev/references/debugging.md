# Kernel Debugging

> 权威源：`Documentation/admin-guide/`、`Documentation/dev-tools/`（ftrace、kgdb、kasan 等）。
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

## Oops / panic triage

```
1. 用 addr2line / scripts/faddr2line 解调用栈
2. 判断 oops 在内核还是模块
3. 模块 → 查指针生命周期 / 稳定符号使用
4. 内核 → 上报上游，别本地乱 patch

aarch64-linux-gnu-addr2line -e vmlinux <hex_address>
scripts/faddr2line vmlinux my_function+0x1c
```
