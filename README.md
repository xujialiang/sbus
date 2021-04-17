**# SBUSUART**

用于接收和解析遥控器接收机的SBUS输出信号

### 安装 


```shell

npm install sbusuart --save

```


### 初始化

```javascript
const SerialPort = require('serialport')

var sbus = new SBUSUART();

或自定义参数:
var sbus = new SBUSUART(start_byte = '0f', end_byte = '0x', sbus_frame_len = 25, sbus_num_channels = 18, baudRate = 100000, stopBits = 2, parity = 'even', dataBits = 8);


```



### 数值归一化(将SBUS数值，映射到0~1)

```javascript
// min表示遥控器的最小值
// max表示遥控器的最大值
sbus.setupConvertParams(min, max);
```



### 开始获取数据

```javascript
// status: 信号正常为0 信号丢失为1 输出failsafe信号时为2
// channels: 原始信号
// channels_c: 归一化值，0~1之间
sbus.start('/dev/tty.usbserial-00003314B', (status, channels, channels_c)=>{
	console.debug('Decode Data:', status, channels, channels_c);
});
```






