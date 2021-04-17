const SerialPort = require('serialport')

const START_BYTE = 0x0f;
const END_BYTE = 0x00;
const SBUS_FRAME_LEN = 25; // SBUS帧，默认25个字节
const SBUS_NUM_CHANNELS = 18;
const SBUS_SIGNAL_OK = 0; // 信号正常为0
const SBUS_SIGNAL_LOST = 1; // 信号丢失为1
const SBUS_SIGNAL_FAILSAFE = 2; // 输出failsafe信号时为2


class SBUSUART {
    constructor(start_byte = START_BYTE, end_byte = END_BYTE, sbus_frame_len = SBUS_FRAME_LEN, sbus_num_channels = SBUS_NUM_CHANNELS, baudRate = 100000, stopBits = 2, parity = 'even', dataBits = 8){
        this.START_BYTE= start_byte;
        this.END_BYTE= end_byte;
        this.SBUS_FRAME_LEN= sbus_frame_len;
        this.SBUS_NUM_CHANNELS= sbus_num_channels;
        this.sbusFrame = Buffer(this.SBUS_FRAME_LEN)  // SBUS数据帧，默认25个字节
        this.sbusFrameArray = [];
        this.baudRate = baudRate;
        this.stopBits = stopBits;
        this.parity = parity;
        this.dataBits = dataBits;

        this.sbusChannels = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; //数据通道默认值
        this.failSafeStatus = SBUS_SIGNAL_FAILSAFE; // 默认状态
    }

    start(port='/dev/tty.usbserial-00003314B', callback, errcallback){
        let that = this;
        this.port = new SerialPort(port, {
            baudRate: this.baudRate,
            stopBits: this.stopBits,
            parity: this.parity,
            dataBits: this.dataBits
        });

        this.port.open(function (err) {
            if (err) {
                console.error('Error opening port: ', err.message)
                if(errcallback){
                    errcallback(err);
                }
                return;
            }
        });
        // The open event is always emitted
        this.port.on('open', function() {
            console.log('open');
        })
        // Open errors will be emitted as an error event
        this.port.on('error', function(err) {
            console.error('Error: ', err.message)
            if(errcallback){
                errcallback(err);
            }
        });

        this.port.on('readable', function () {
            // 每次读一个字节，放自己的缓存队列。
            var data = that.port.read(1);
            // console.debug('Data:', data, data.toString('hex'));
            if(that.sbusFrameArray.length<that.SBUS_FRAME_LEN){
                that.sbusFrameArray.push(data);
            }else{
                let subArr = that.sbusFrameArray.slice(1);
                subArr.push(data);
                that.sbusFrameArray = subArr;
                // 解码
                that.decodeSBUSFrame(that.sbusFrameArray,callback);
            }
            // console.debug('ALl Data:', new Date(),that.sbusFrameArray);
            
        });
    }

    decodeSBUSFrame(data,callback){
        // 判断是否以0f开头， 00结尾
        if(data[0].toString('hex') == '0f' && data[this.SBUS_FRAME_LEN-1].toString('hex') == '00'){
            
            var sbusFrameIntArr = [];
            data.forEach(buf=>{
                sbusFrameIntArr.push(parseInt(buf[0]));
            });
            console.debug('解析SBUS.Frame:', sbusFrameIntArr);
            // # CH1 = [data2]的低3位 + [data1]的8位（678+12345678 = 678,12345678）
            this.sbusChannels[0] = (sbusFrameIntArr[1] | sbusFrameIntArr[2] << 8) & 0x07FF;
            // # CH2 = [data3]的低6位 + [data2]的高5位（345678+12345 = 345678,12345 ）
            this.sbusChannels[1] = (sbusFrameIntArr[2] >> 3 | sbusFrameIntArr[3] << 5) & 0x07FF;
            // # CH3 = [data5]的低1位 + [data4]的8位 + [data3]的高2位（8+12345678+12 = 8,12345678,12）
            this.sbusChannels[2] = (sbusFrameIntArr[3] >> 6 | sbusFrameIntArr[4] << 2 | sbusFrameIntArr[5] << 10) & 0x07FF;
            this.sbusChannels[3] = (sbusFrameIntArr[5] >> 1 | sbusFrameIntArr[6] << 7) & 0x07FF;
            this.sbusChannels[4] = (sbusFrameIntArr[6] >> 4 | sbusFrameIntArr[7] << 4) & 0x07FF;
            this.sbusChannels[5] = (sbusFrameIntArr[7] >> 7 | sbusFrameIntArr[8] << 1 | sbusFrameIntArr[9] << 9) & 0x07FF;
            this.sbusChannels[6] = (sbusFrameIntArr[9] >> 2 | sbusFrameIntArr[10] << 6) & 0x07FF;
            this.sbusChannels[7] = (sbusFrameIntArr[10] >> 5 | sbusFrameIntArr[11] << 3) & 0x07FF;
            this.sbusChannels[8] = (sbusFrameIntArr[12] | sbusFrameIntArr[13] << 8) & 0x07FF;
            this.sbusChannels[9] = (sbusFrameIntArr[13] >> 3 | sbusFrameIntArr[14] << 5) & 0x07FF;
            this.sbusChannels[10] = (sbusFrameIntArr[14] >> 6 | sbusFrameIntArr[15] << 2 | sbusFrameIntArr[16] << 10) & 0x07FF;
            this.sbusChannels[11] = (sbusFrameIntArr[16] >> 1 | sbusFrameIntArr[17] << 7) & 0x07FF;
            this.sbusChannels[12] = (sbusFrameIntArr[17] >> 4 | sbusFrameIntArr[18] << 4) & 0x07FF;
            this.sbusChannels[13] = (sbusFrameIntArr[18] >> 7 | sbusFrameIntArr[19] << 1 | sbusFrameIntArr[20] << 9) & 0x07FF;
            this.sbusChannels[14] = (sbusFrameIntArr[20] >> 2 | sbusFrameIntArr[21] << 6) & 0x07FF;
            this.sbusChannels[15] = (sbusFrameIntArr[21] >> 5 | sbusFrameIntArr[22] << 3) & 0x07FF;

            // # 17频道，第24字节的最低一位
            if(sbusFrameIntArr[23] & 0x0001){
                this.sbusChannels[16] = 2047;
            }else{
                this.sbusChannels[16] = 0
            }
            // # 18频道，第24字节的低第二位，所以要右移一位
            if(sbusFrameIntArr[23] >> 1 & 0x0001){
                this.sbusChannels[17] = 2047;
            }else{
                this.sbusChannels[17] = 0
            }

            // # 帧丢失位为1时，第24字节的低第三位，与0x04进行与运算
            this.failSafeStatus = SBUS_SIGNAL_OK
            if (sbusFrameIntArr[23] & (1 << 2)){
                this.failSafeStatus = this.SBUS_SIGNAL_LOST
            }
            // # 故障保护激活位为1时，第24字节的低第四位，与0x08进行与运算
            if (sbusFrameIntArr[23] & (1 << 3)){
                this.failSafeStatus = this.SBUS_SIGNAL_FAILSAFE
            }

            if(callback){
                callback(this.failSafeStatus, this.sbusChannels);
            }
        }
    }
}

module.exports = SBUSUART;
