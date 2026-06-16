# Kernel Coding Style

> 权威源：`Documentation/process/coding-style.rst`。本文件是工作速查；有歧义以该 .rst 为准。
> 提交前一律跑 `checkpatch.pl`（见 `patch-workflow.md`）。

## Formatting

- **Indentation**: Tabs, 8 characters wide. NOT spaces. (coding-style §1)
  - 例外：注释、文档、Kconfig 里用空格。
  - `switch`/`case` 同列对齐，不 double-indent。
- **Line length**: **首选 80 列**（coding-style §2 原文："preferred limit … is 80 columns"）。超 80 应拆成合理块，除非拆了更难读。`checkpatch.pl` 在**超过 100 列**时告警——80 是首选、100 是硬告警线，别把两者混为"100 max"。
  - **绝不**折断用户可见字符串（printk 等），否则没法 grep。
- **Braces**: K&R —— 开括号放行尾；函数例外（开括号另起一行）。(coding-style §3)
  - 单语句不加括号；但若 `if`/`else` 有一支是多语句，则**两支都加**括号。
  - 循环含多于一条简单语句时加括号。
- **No multiple statements / assignments per line.** 避免炫技表达式。
- **No trailing whitespace.**
- **No typedef for structs** unless opaque type —— 直接用 `struct foo`。
- **Function length**: 短为宜；一个函数只做一件事、能一屏看完。

## Naming

- **lowercase_with_underscores**：`my_function_name`, `struct my_device`
- **全局符号**加子系统前缀：`pci_register_driver()`, `usb_submit_urb()`
- **局部变量**可短：`i`, `ret`, `dev`, `np`
- **宏 / 常量**：`UPPER_CASE`（`MODULE_LICENSE`, `PAGE_SIZE`）
- 不用匈牙利命名，不用 camelCase

## Comments

- 普通注释用 `/* C89 风格 */`，**不用** `//`（coding-style）。
  - 例外：文件首行的 SPDX 标识用 `// SPDX-License-Identifier: ...`（这是规定写法）。
- 导出函数用 kernel-doc：

```c
/**
 * my_func - Brief description
 * @param1: Description of param1
 * @param2: Description of param2
 *
 * Longer description if needed.
 *
 * Return: 0 on success, negative errno on failure.
 */
```

## Error Handling

- 返回负 errno：`-ENOMEM`, `-EINVAL`, `-EIO`
- 用 `goto` 集中清理，逆序释放：

```c
int my_init(struct device *dev)
{
	struct resource *res;
	void __iomem *base;
	int ret;

	res = platform_get_resource(dev, IORESOURCE_MEM, 0);
	if (!res)
		return -ENODEV;

	base = devm_ioremap_resource(dev, res);
	if (IS_ERR(base))
		return PTR_ERR(base);

	ret = clk_prepare_enable(clk);
	if (ret)
		goto err_unmap;

	ret = request_irq(irq, my_handler, 0, "my-dev", dev);
	if (ret)
		goto err_clk;

	return 0;

err_clk:
	clk_disable_unprepare(clk);
err_unmap:
	iounmap(base);
	return ret;
}
```

## Memory Management

- **优先 `devm_` 托管 API**：`devm_kzalloc()`, `devm_ioremap_resource()`, `devm_clk_get()`, `devm_request_irq()` —— 自动逆序释放，省掉手工清理顺序错误。
- **GFP flags**：`GFP_KERNEL`（可睡眠上下文）、`GFP_ATOMIC`（中断 / 持 spinlock 上下文）。
- 永远检查分配返回值。
- **中断上下文绝不用 `GFP_KERNEL`**（见 `concurrency.md` + SKILL Forbidden Actions #1）。
