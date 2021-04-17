var  SBUSUART = require('./sbus');

new SBUSUART().start('/dev/tty.usbserial-00003314B', (status, channels)=>{
    console.debug('Decode Data:', this.failSafeStatus, this.sbusChannels);
});