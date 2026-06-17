# Build System · Kbuild Makefile, Kconfig, Compiling

> 权威源：`Documentation/kbuild/`（`makefiles.rst`、`kconfig-language.rst`、`modules.rst`）、
> `Documentation/admin-guide/README.rst`。命令/语义以目标树为准。
> Makefile/Kconfig 代码模板见 `templates.md`；defconfig 改配置纪律见 `bsp_discipline.md`。

何时加载本模块：写 Kbuild Makefile、加 Kconfig 选项、配置内核、交叉编译内核/模块、in-tree vs out-of-tree 构建。

## Kbuild Makefile

```make
# in-tree：放进内核源码树某目录的 Makefile
obj-$(CONFIG_MY_DRIVER) += my_driver.o      # 跟着 Kconfig 走 y/m
my_driver-y := main.o hw.o util.o           # 多文件模块
```

```make
# out-of-tree：独立目录的 Makefile
obj-m := my_driver.o
KDIR ?= /lib/modules/$(shell uname -r)/build   # 或交叉编译的内核 build 目录
default:
	$(MAKE) -C $(KDIR) M=$(PWD) modules
```

- `obj-y` 编进内核(built-in)；`obj-m` 编成模块(.ko)；`obj-$(CONFIG_X)` 跟着配置走。
- out-of-tree 必须 `-C <内核 build 目录> M=$(PWD)`——是借内核的构建系统编，不是直接 gcc。

## Kconfig 语言

```kconfig
config MY_DRIVER
	tristate "My device driver"     # bool=y/n；tristate=y/m/n(可编成模块)
	depends on OF && I2C            # 依赖不满足则该项不可选
	select REGMAP_I2C               # 强制选中依赖(慎用,不查它自己的 depends)
	default m if ARCH_FOO
	help
	  Say M here to build as a module (my_driver).
```

- 类型：`bool` / `tristate` / `int` / `hex` / `string`。要能编成模块就用 `tristate`。
- `depends on` 是"满足才出现"；`select` 是"强行选中"(可能拉出未满足依赖的项，优先 `depends on` + `imply`)。

## 配置内核(原生流程，别手改 defconfig)

```sh
export ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu-
make <board>_defconfig          # 生成 .config
make menuconfig                 # 或 scripts/kconfig/merge_config.sh .config frag.cfg
make olddefconfig               # 让 Kconfig 引擎跑 select/depends 连锁
make savedefconfig && cp defconfig arch/arm64/configs/<board>_defconfig
```

**绝不手改 defconfig**——漏连锁依赖会 build 过但 runtime 静默缺功能。完整纪律见 `bsp_discipline.md`。

## 编译

```sh
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- -j$(nproc) Image modules dtbs
make ... modules_install INSTALL_MOD_PATH=<rootfs>
make ... INSTALL_DTBS_PATH=<dst> dtbs_install
```

## 模块要素(源码里)

| 宏 | 作用 |
|---|---|
| `module_init` / `module_exit` | 入口/出口(或 `module_platform_driver` 等封装) |
| `MODULE_LICENSE("GPL")` | **必填**——缺了内核被 taint，且 GPL-only 导出符号对本模块不可用。见 `known-bugs.md` KB-BUILD-001 |
| `MODULE_DEVICE_TABLE` | 生成模块别名，让 udev/内核按设备自动加载 |
| `EXPORT_SYMBOL` / `EXPORT_SYMBOL_GPL` | 把符号导出给别的模块用(GPL 版只给 GPL 模块) |

## 版本敏感 / 常见坑

- 模块的 vermagic(内核版本/配置)要和目标内核匹配，否则 `insmod` 报 `version magic` 失败。out-of-tree 必须对**目标内核**的 build 目录编。
- 手改 defconfig 漏依赖(KB 见 `bsp_discipline.md` 的 defconfig 纪律)。
- 缺 `MODULE_LICENSE` → taint + 用不了 `EXPORT_SYMBOL_GPL` 的符号(KB-BUILD-001)。
- out-of-tree 不指 `-C $(KDIR) M=$(PWD)`，当普通用户程序 gcc 编 → 一堆找不到头文件。
- `select` 滥用拉出依赖不满足的项 → 配置矛盾；优先 `depends on`。
