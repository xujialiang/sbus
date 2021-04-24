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
        this.baudRate = baudRate;
        this.stopBits = stopBits;
        this.parity = parity;
        this.dataBits = dataBits;

        this.sbusChannels = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; //数据通道默认值
        this.sbusChannels_c = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; //数据通道默认值

        this.failSafeStatus = SBUS_SIGNAL_FAILSAFE; // 默认状态
    }

    setupConvertParams(channel_min, channel_max){
        this.channel_max = channel_max;
        this.channel_min = channel_min;
    }

    listDevice(callback,errcallback){
        SerialPort.list().then(ports=>{
            callback(ports);
        }).catch(err=>{
            errcallback(err);
        });
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
            if(errcallback){s
                errcallback(err);
            }
        });

        this.port.on('readable', function () {
            that.port.read();
        });
        this.port.on('data', function(data) {
            if(data.byteLength == 25 && !(data[0] ^ that.START_BYTE)  && !(data[that.SBUS_FRAME_LEN-1] ^ that.END_BYTE)){
                that.sbusFrame = data;
            }else{
                // 以0f开头, 但不是00结尾，且不是25字节
                if(!(data[0] ^ that.START_BYTE)){
                    console.log('0f开头');
                    that.sbusFrame = data;
                }else{
                    // 不是0f开头，但是00结尾
                    if(!(data[data.byteLength-1] ^ that.END_BYTE)){
                        console.log('00结尾');
                        that.sbusFrame = Buffer.concat([that.sbusFrame, data]);
                        console.log('Full Frame', that.sbusFrame);
                    }
                }
            }
        });

        setInterval(() => {
            that.decodeSBUSFrame(that.sbusFrame, callback)
        }, 100);
    }

    decodeSBUSFrame(sbusFrames, callback){
        // 判断是否以0f开头， 00结尾
        // console.debug('解析SBUS.Frame:', sbusFrameIntArr);
        this.sbusChannels[0] = (sbusFrames[1] | sbusFrames[2] << 8) & 0x07FF;
        this.sbusChannels[1] = (sbusFrames[2] >> 3 | sbusFrames[3] << 5) & 0x07FF;
        this.sbusChannels[2] = (sbusFrames[3] >> 6 | sbusFrames[4] << 2 | sbusFrames[5] << 10) & 0x07FF;
        this.sbusChannels[3] = (sbusFrames[5] >> 1 | sbusFrames[6] << 7) & 0x07FF;
        this.sbusChannels[4] = (sbusFrames[6] >> 4 | sbusFrames[7] << 4) & 0x07FF;
        this.sbusChannels[5] = (sbusFrames[7] >> 7 | sbusFrames[8] << 1 | sbusFrames[9] << 9) & 0x07FF;
        this.sbusChannels[6] = (sbusFrames[9] >> 2 | sbusFrames[10] << 6) & 0x07FF;
        this.sbusChannels[7] = (sbusFrames[10] >> 5 | sbusFrames[11] << 3) & 0x07FF;
        this.sbusChannels[8] = (sbusFrames[12] | sbusFrames[13] << 8) & 0x07FF;
        this.sbusChannels[9] = (sbusFrames[13] >> 3 | sbusFrames[14] << 5) & 0x07FF;
        this.sbusChannels[10] = (sbusFrames[14] >> 6 | sbusFrames[15] << 2 | sbusFrames[16] << 10) & 0x07FF;
        this.sbusChannels[11] = (sbusFrames[16] >> 1 | sbusFrames[17] << 7) & 0x07FF;
        this.sbusChannels[12] = (sbusFrames[17] >> 4 | sbusFrames[18] << 4) & 0x07FF;
        this.sbusChannels[13] = (sbusFrames[18] >> 7 | sbusFrames[19] << 1 | sbusFrames[20] << 9) & 0x07FF;
        this.sbusChannels[14] = (sbusFrames[20] >> 2 | sbusFrames[21] << 6) & 0x07FF;
        this.sbusChannels[15] = (sbusFrames[21] >> 5 | sbusFrames[22] << 3) & 0x07FF;

        // # 17频道，第24字节的最低一位
        if(sbusFrames[23] & 0x0001){
            this.sbusChannels[16] = 2047;
        }else{
            this.sbusChannels[16] = 0
        }
        // # 18频道，第24字节的低第二位，所以要右移一位
        if(sbusFrames[23] >> 1 & 0x0001){
            this.sbusChannels[17] = 2047;
        }else{
            this.sbusChannels[17] = 0
        }

        // # 帧丢失位为1时，第24字节的低第三位，与0x04进行与运算
        this.failSafeStatus = SBUS_SIGNAL_OK
        if (sbusFrames[23] & (1 << 2)){
            this.failSafeStatus = this.SBUS_SIGNAL_LOST
        }
        // # 故障保护激活位为1时，第24字节的低第四位，与0x08进行与运算
        if (sbusFrames[23] & (1 << 3)){
            this.failSafeStatus = this.SBUS_SIGNAL_FAILSAFE
        }

        if(callback){
            if(this.channel_min && this.channel_max){
                for (let index = 0; index < this.sbusChannels.length; index++) {
                    const data = this.sbusChannels[index];
                    this.sbusChannels_c[index] = this._convert(data, this.channel_min, this.channel_max)
                }
            }
            callback(this.failSafeStatus, this.sbusChannels, this.sbusChannels_c);
        }   
    }

    _convert(x, min, max){
        if(x<=min){
            return 0;
        }
        return (x - min)/(max - min);
    }

}

module.exports = SBUSUART;
