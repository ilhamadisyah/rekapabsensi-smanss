const fs = require('fs');
const http = require('http');

async function testUpload() {
  const fileBuffer = fs.readFileSync('ABSENSI 1111.xls');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="ABSENSI 1111.xls"\r\nContent-Type: application/vnd.ms-excel\r\n\r\n`;
  const footer = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="uploaded_by"\r\n\r\nadmin\r\n--${boundary}--\r\n`;
  
  const payload = Buffer.concat([
    Buffer.from(header, 'utf8'),
    fileBuffer,
    Buffer.from(footer, 'utf8')
  ]);

  const req = http.request('http://localhost:3000/api/attendance/upload', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length,
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Upload response status:', res.statusCode);
      try {
        const json = JSON.parse(body);
        console.log('Upload response JSON:', json);
      } catch (e) {
        console.log('Raw body:', body);
      }
    });
  });

  req.on('error', err => console.error('Req error:', err));
  req.write(payload);
  req.end();
}

testUpload();
