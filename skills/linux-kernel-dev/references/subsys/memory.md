# Memory Management · Allocators & User Access

> 权威源：`Documentation/mm/`（`slab.rst`、`vmalloc.rst`、`page_allocation.rst`、`highmem.rst`）、
> `include/linux/slab.h`、`include/linux/gfp_types.h`、`include/linux/uaccess.h`、`include/linux/mm.h`。
> GFP 标志和释放配对以目标树这些为准——分配错上下文会睡死、释放配错会崩。

何时加载本模块：在内核里分配/释放内存、选分配器、选 GFP 标志、访问用户空间内存、实现驱动 `mmap` / 缺页、给 DMA 准备缓冲。

## 选哪个分配器

| 需求 | API | 物理连续? | 释放 |
|---|---|---|---|
| 小块（≤ 几页），最常用 | `kmalloc` / `kzalloc`（清零） | 是 | `kfree` |
| 数组（防乘法溢出） | `kmalloc_array` / `kcalloc` | 是 | `kfree` |
| 大块，不强求物理连续 | `kvmalloc`（先试连续，退化到 vmalloc） | 不保证 | `kvfree` |
| 大块，只需虚拟连续 | `vmalloc` | 否 | `vfree` |
| 整页 / 多页 | `alloc_pages` / `__get_free_pages` | 是 | `__free_pages` / `free_pages` |
| 大量同尺寸对象 | `kmem_cache_create` + `kmem_cache_alloc` | 是 | `kmem_cache_free` |
| 设备生命周期托管 | `devm_kmalloc` | 是 | 自动（probe 失败/remove） |

经验：默认 `kmalloc`/`kzalloc`；大到可能失败（几十 KB 以上）用 `kvmalloc`；只内核访问的大缓冲用 `vmalloc`；DMA 缓冲见下（别拿 `vmalloc` 的内存做 DMA——不物理连续）。

## GFP 标志与上下文（决定能不能睡）

| 标志 | 能睡? | 用在哪 |
|---|---|---|
| `GFP_KERNEL` | **是**（会触发回收/换出而睡眠） | 进程上下文，**不能**在中断/原子/持 spinlock 时用 |
| `GFP_ATOMIC` | 否 | 中断处理、tasklet/softirq、持 spinlock 时 |
| `GFP_NOWAIT` | 否 | 不愿等回收，失败就失败 |
| `__GFP_ZERO` | — | 附加：清零（`kzalloc` = `kmalloc` + 此标志） |
| `__GFP_DMA` / `GFP_DMA` | — | 从 DMA 区分配（老硬件地址限制） |

`GFP_KERNEL` 在原子/中断上下文 = `BUG: sleeping function called from invalid context`。规则同 SKILL Forbidden Actions #1、`interrupts.md`、`concurrency.md`。见 `known-bugs.md` KB-MM-001。

## 释放必须配对（配错会崩或泄漏）

`kmalloc`/`kzalloc`/`kmalloc_array`/`kcalloc` → `kfree`；`kvmalloc` → `kvfree`；`vmalloc` → `vfree`；`__get_free_pages` → `free_pages`；`alloc_pages` → `__free_pages`；`kmem_cache_alloc` → `kmem_cache_free`。

每次分配都检查返回 `NULL`（`devm_*` 也要）。

## 访问用户空间内存（安全要害）

**绝不直接解引用用户传进来的指针**——用专用接口，它们处理缺页和地址校验：

```c
if (copy_from_user(&kbuf, ubuf, len))   /* 返回未拷贝字节数,非 0 = 失败 */
    return -EFAULT;
if (copy_to_user(ubuf, &kbuf, len))
    return -EFAULT;
get_user(val, uptr);   put_user(val, uptr);   /* 单个值 */
```

- 返回值是「没拷成的字节数」，非 0 即失败，返回 `-EFAULT`。
- `access_ok()` 只校验地址范围、不保证可访问——别用它替代 `copy_*_user`。

## 驱动 mmap / 缺页

`file_operations.mmap` 里把设备内存映射给用户：

- 整段映射：`remap_pfn_range(vma, vma->vm_start, pfn, size, vma->vm_page_prot)`。
- 按需缺页：设 `vma->vm_ops`（`struct vm_operations_struct`）的 `.fault`，在里面 `vmf_insert_pfn()` / 返回页。
- 相关结构：`struct vm_area_struct`（vma）、`struct vm_fault`。

## DMA 内存（指向）

DMA-able 缓冲用 DMA API（`dma_alloc_coherent` 等，属驱动 DMA 范畴），不要拿 `vmalloc` 的内存（非物理连续）直接做 DMA。现代内核分配 DMA-heap 缓冲见 `known-bugs.md` KB-ION-001。

## 内部概览（深入读权威源）

伙伴系统 / zones / watermarks → `Documentation/mm/page_allocation.rst`；slab/slub → `slab.rst`；vmalloc 区 → `vmalloc.rst`；高端内存 → `highmem.rst`。

## 版本敏感（按目标树核）

- `__GFP_ATOMIC` 较新内核已移除（7.0 树查无此符号）——用组合宏 `GFP_ATOMIC`，别在代码里写 `__GFP_ATOMIC`。按目标树 `include/linux/gfp_types.h` 核。
- `kvmalloc` / `kvfree` 是相对新的接口；老树没有时用 `kmalloc`/`vmalloc` 分别处理。

## 常见坑

- 在原子/中断/持 spinlock 时用 `GFP_KERNEL`（会睡）→ 崩。改 `GFP_ATOMIC`。
- 用 `kmalloc` 要超大物理连续块（碎片下易失败）→ 用 `kvmalloc` / `vmalloc`。
- 释放函数配错（`vmalloc` 的内存 `kfree`）→ 崩。
- 直接解引用用户指针 → 用 `copy_*_user`。
- 不检查分配返回 `NULL`。
- 拿 `vmalloc` 内存做 DMA（不物理连续）。
