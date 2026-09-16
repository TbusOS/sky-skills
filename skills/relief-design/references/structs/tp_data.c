/* 图上画的就是这段 —— 布局交给编译器算，不是人算的。
 *
 * 为什么要有这个文件：结构体布局图上每个偏移、每个空洞、每个大小都必须自洽，
 * 而人算一定会错。第一版手写的图就写过「两个空洞共 15 字节」，实际 7+7=14。
 * 现在图由 gen_struct_figure.py 从 pahole 的输出生成，数字不可能对不上。
 *
 * 内核类型在这里用形状相同的占位声明（struct mutex 是 24 字节三个字长），
 * 这样这份文件自己编得过，pahole 给出的就是图上该画的布局。
 */
typedef _Bool              bool;
typedef unsigned char      u8;
typedef unsigned short     u16;
typedef unsigned int       u32;
typedef unsigned long long u64;

struct mutex { long owner; void *wait_lock; void *head; };
struct i2c_client;

struct tp_data {
	bool               present;
	u64                last_ts;
	u8                 lanes;
	struct mutex       lock;
	struct i2c_client *client;
	char               name[16];
};

struct tp_cfg {
	u8  mode   : 3;
	u8  lanes  : 2;
	u16 rate;
	u32 window;
} __attribute__((packed));

struct tp_cfg_unpacked {
	u8  mode   : 3;
	u8  lanes  : 2;
	u16 rate;
	u32 window;
};

/* 让这几个类型进 DWARF */
struct tp_data           _a;
struct tp_cfg            _b;
struct tp_cfg_unpacked   _c;
