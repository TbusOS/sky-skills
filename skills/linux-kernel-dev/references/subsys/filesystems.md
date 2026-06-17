# Filesystems · VFS, file_operations & exposing data

> 权威源：`Documentation/filesystems/`（`vfs.rst`、`seq_file.rst`、`proc.rst`、`sysfs.rst`、
> `api-summary.rst`、`porting.rst`）、`include/linux/fs.h`、`seq_file.h`、`proc_fs.h`、`debugfs.h`、
> `fs_context.h`。接口签名/版本以目标树这些为准——VFS 回调签名和挂载 API 都随版本变过。

何时加载本模块：实现字符设备/虚拟文件的读写回调、把内核数据导出给用户看（debugfs / procfs / sysfs / seq_file）、写一个真文件系统、理解 VFS 对象与 page cache。

## VFS 四对象 + 操作表

| 对象 | 操作表 | 管什么 |
|---|---|---|
| `struct super_block` | `super_operations` | 一个已挂载实例（分配/释放 inode、同步、统计） |
| `struct inode` | `inode_operations` | 文件元数据 + 命名空间操作（lookup/create/mkdir…） |
| `struct dentry` | `dentry_operations` | 目录项缓存（路径名 ↔ inode） |
| `struct file` | `file_operations` | 一个打开的文件（read/write/ioctl/mmap…） |
| 页缓存 | `address_space_operations` | 文件页与后备存储之间（readpage/writepage/…） |

驱动/模块九成只碰 `file_operations`；写真文件系统才需要前面几张表。

## 实现 file_operations（最常用）

```c
static const struct file_operations my_fops = {
    .owner          = THIS_MODULE,
    .open           = my_open,        /* int (*)(struct inode *, struct file *) */
    .release        = my_release,
    .read           = my_read,        /* ssize_t (*)(struct file *, char __user *, size_t, loff_t *) */
    .write          = my_write,
    .unlocked_ioctl = my_ioctl,
    .llseek         = default_llseek,
};
```

- 回调都在进程上下文，可睡。读写**绝不直接解引用用户 buffer**——用 `copy_to_user` / `copy_from_user`（见 `memory.md`）。
- `.read`/`.write` 要按拷贝的字节数推进 `*ppos` 并返回字节数；`.read` 不推进 `*ppos` 会让 `cat` 死循环。
- 新代码优先 `.read_iter`/`.write_iter`（`struct iov_iter`），旧的 `.read`/`.write` 仍可用。

## 把内核数据导出给用户（驱动最常做）

| 方式 | API | 用途 |
|---|---|---|
| debugfs | `debugfs_create_dir` / `debugfs_create_file` | 调试信息——**不是稳定 ABI**，随时可变 |
| procfs | `proc_mkdir` / `proc_create`（末参 `struct proc_ops`） | 传统 `/proc` 入口 |
| seq_file | `single_open` + `seq_printf`/`seq_puts`（或 `DEFINE_SHOW_ATTRIBUTE` 一把梭） | 安全分页输出，免自己管 buffer |
| sysfs | `DEVICE_ATTR` + show/store | 一属性一值 |

输出多行/大量数据用 **seq_file**，别自己 `sprintf` 进一个固定 buffer（会截断/溢出）。最简：

```c
static int my_show(struct seq_file *m, void *v) { seq_printf(m, "%d\n", val); return 0; }
DEFINE_SHOW_ATTRIBUTE(my);   /* 生成 my_fops，配 debugfs_create_file / proc_create */
```

## 写一个真文件系统（重路径 · 概览）

```c
static struct file_system_type my_fs_type = {
    .owner           = THIS_MODULE,
    .name            = "myfs",
    .init_fs_context = my_init_fs_context,   /* 现代挂载入口 */
    .kill_sb         = kill_litter_super,    /* 或 generic_shutdown_super 包装 */
};
register_filesystem(&my_fs_type);            /* 卸载时 unregister_filesystem */
```

挂载里用 `get_tree_bdev()`（块设备文件系统）或 `get_tree_nodev()`（无设备，如 tmpfs 类）填 `fs_context`。再实现 `super_operations` / `inode_operations` / 需要页缓存则 `address_space_operations`。深入读 `Documentation/filesystems/vfs.rst` + `porting.rst`，别凭印象。

## 版本敏感（按目标树核）

- **procfs**：`proc_create` 末参自 5.6 起从 `struct file_operations` 改成 `struct proc_ops`。移植旧 `/proc` 代码到新内核必踩。见 `known-bugs.md` KB-FS-001。
- **挂载 API**：旧的 `.mount` + `mount_bdev`/`mount_nodev` 已被 `fs_context` 取代——`mount_bdev`/`mount_nodev` 在 7.0 树已查无；6.1 过渡期两者都在。新代码用 `.init_fs_context` + `get_tree_bdev`/`get_tree_nodev`。
- 读写回调：`.read`/`.write`（旧）vs `.read_iter`/`.write_iter`（新，推荐）。

## 常见坑

- `proc_create` 末参在新内核传了 `struct file_operations`（要 `struct proc_ops`）→ 编译错（KB-FS-001）。
- `.read` 回调不推进 `*ppos` → `cat` 读不到 EOF 死循环。
- 直接解引用用户 buffer，不用 `copy_*_user`。
- 大量数据自己 `sprintf` 进定长 buffer 而不用 seq_file → 截断/溢出。
- 把 debugfs 当稳定用户 ABI（它不是）。
