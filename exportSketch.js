const fs = require("fs");
const YAML = require("js-yaml");

try {
  // 读取 YAML 文件并解析为 JavaScript 对象
  const inputData = YAML.load(
    fs.readFileSync("beluga-color-token.yml", "utf8"),
  );

  // 将 alpha 值从 0-100 转换为 0-255
  function alphaToHex(alpha) {
    const hexValue = Math.round((alpha / 100) * 255).toString(16);
    return hexValue.length === 1 ? `0${hexValue}` : hexValue;
  }

  // 根据 major、index 和 alias 生成 Sketch 格式的颜色变量
  function generateSketchColor(major, index, alias, color, alpha) {
    const hexColor = color.replace("#", "");
    const hexAlpha = alphaToHex(alpha);
    return `var(--${major}-${index}-${alias}): #${hexColor}${hexAlpha};`;
  }

  // 处理语义层颜色
  function processSemanticColors(semanticColors, major) {
    const result = [];

    const colors = semanticColors;
    const aliases = inputData.outputConfig?.general?.alias?.regular || [];

    if (colors && typeof colors === "object") {
      for (const [alias, color] of Object.entries(colors)) {
        if (Array.isArray(color) && aliases.includes(alias)) {
          const [colorValue, alphaValue] = color;
          const index = aliases.indexOf(alias) + 1;
          result.push(
            generateSketchColor(major, index, alias, colorValue, alphaValue),
          );
        }
      }

      if (colors.expand && typeof colors.expand === "object") {
        const expandAliases =
          inputData.outputConfig?.general?.alias?.expand || [];
        for (const [alias, expandColor] of Object.entries(colors.expand)) {
          if (
            expandColor &&
            Array.isArray(expandColor) &&
            expandAliases.includes(alias)
          ) {
            const [colorValue, alphaValue] = expandColor;
            const index = expandAliases.indexOf(alias) + 1;
            result.push(
              generateSketchColor(
                major,
                aliases.length + index,
                alias,
                colorValue,
                alphaValue,
              ),
            );
          }
        }
      }
    }

    return result;
  }

  // 处理 lightMode 和 darkMode
  function processColorMode(colorMode) {
    const result = [];

    for (const key in colorMode) {
      if (colorMode[key] && typeof colorMode[key] === "object") {
        if (key !== "background") {
          result.push(...processSemanticColors(colorMode[key], key));
        }
      }
    }

    if (colorMode.basic && typeof colorMode.basic === "object") {
      const basicColors = colorMode.basic;
      for (const [basicKey, basicColor] of Object.entries(basicColors)) {
        if (Array.isArray(basicColor)) {
          const [colorValue, alphaValue] = basicColor;
          const index = Object.keys(basicColors).indexOf(basicKey) + 1;
          result.push(
            generateSketchColor(
              "basic",
              index,
              basicKey,
              colorValue,
              alphaValue,
            ),
          );
        }
      }
    }

    return result;
  }

  // 处理 lightMode 和 darkMode
  function processColorMode(colorMode) {
    const result = [];

    for (const key in colorMode) {
      if (key === "basic") {
        const basicColors = colorMode.basic;
        for (const [basicKey, basicColor] of Object.entries(basicColors)) {
          if (Array.isArray(basicColor)) {
            const [colorValue, alphaValue] = basicColor;
            const index = Object.keys(basicColors).indexOf(basicKey) + 1;
            result.push(
              generateSketchColor(
                "basic",
                index,
                basicKey,
                colorValue,
                alphaValue,
              ),
            );
          }
        }
      } else {
        result.push(...processSemanticColors(colorMode[key]));
      }
    }

    return result;
  }

  // 处理 lightMode 和 darkMode
  function processColorMode(colorMode) {
    const result = [];

    for (const key in colorMode) {
      if (key === "basic") {
        const basicColors = colorMode.basic;
        result.push(
          ...Object.entries(basicColors).map(
            ([basicKey, basicColor], index) => {
              const [colorValue, alphaValue] = basicColor;
              return generateSketchColor(
                "basic",
                index + 1,
                basicKey,
                colorValue,
                alphaValue,
              );
            },
          ),
        );
      } else {
        result.push(...processSemanticColors(colorMode[key]));
      }
    }

    return result;
  }

  // 处理输出结果
  function processOutput() {
    const lightModeColors = processColorMode(
      inputData.schemeToken?.lightMode || {},
    );
    const darkModeColors = processColorMode(
      inputData.schemeToken?.darkMode || {},
    );

    console.log("lightMode:");
    console.log(lightModeColors.join("\n"));

    console.log("\ndarkMode:");
    console.log(darkModeColors.join("\n"));
  }

  processOutput();
} catch (error) {
  console.error("Error:", error.message);
}
