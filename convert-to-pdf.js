const puppeteer = require('puppeteer');
const path = require('path'); // Import the path module to handle file paths

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Construct the absolute file path

    const filePath = path.resolve(__dirname, './public/program-enrollment-certificate-template/otg/certificate.html');

    
    // Use the file:// protocol with the absolute path
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // Generate PDF

    await page.pdf({
      path: 'output.pdf',
      width: '1440px',
      height: '1120px',
      printBackground: true,
      margin: {
        left: '0px',
        top: '0px',
        right: '0px',
        bottom: '0px'
      }
    });
    await browser.close();
    console.log('PDF successfully created!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
