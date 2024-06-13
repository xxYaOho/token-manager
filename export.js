const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// 获取当前时间并格式化
const getFormattedDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

// 在桌面上创建文件
const writeToDesktop = (baseName, content) => {
  const desktopDir = path.join(
    process.env.HOME || process.env.USERPROFILE,
    "Desktop",
  );
  const filePath = path.join(desktopDir, `${baseName}.md`);
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`File created at: ${filePath}`);
};

// 根据命令行参数处理输出
const [, , scriptName] = process.argv;

if (scriptName) {
  const scriptPath = path.join(__dirname, "script", scriptName);
  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ${scriptName}: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    // 解析输出并根据模式分开写入文件
    const lightModeStart = stdout.indexOf("const lightModeColors = {");
    const darkModeStart = stdout.indexOf("const darkModeColors = {");

    if (lightModeStart !== -1) {
      const lightModeEnd = stdout.indexOf("};", lightModeStart) + 2;
      const lightModeContent = stdout.substring(lightModeStart, lightModeEnd);
      const timestamp = getFormattedDate();
      writeToDesktop(`${scriptName}_${timestamp}_lightMode`, lightModeContent);
    }

    if (darkModeStart !== -1) {
      const darkModeEnd = stdout.indexOf("};", darkModeStart) + 2;
      const darkModeContent = stdout.substring(darkModeStart, darkModeEnd);
      const timestamp = getFormattedDate();
      writeToDesktop(`${scriptName}_${timestamp}_darkMode`, darkModeContent);
    }
  });
} else {
  console.error("Please provide a script name to execute.");
}
