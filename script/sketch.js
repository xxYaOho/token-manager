const fs = require("fs");
const YAML = require("js-yaml");
const path = require("path");

try {
  // 读取 YAML 文件并解析为 JavaScript 对象
  const inputData = YAML.load(
    fs.readFileSync(path.join(__dirname, "../beluga-color-token.yml"), "utf8"),
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
    let index = 1;

    if (colors && typeof colors === "object") {
      for (const [alias, color] of Object.entries(colors)) {
        if (Array.isArray(color) && aliases.includes(alias)) {
          const [colorValue, alphaValue] = color;
          result.push(
            generateSketchColor(major, index, alias, colorValue, alphaValue),
          );
          index++;
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
            result.push(
              generateSketchColor(major, index, alias, colorValue, alphaValue),
            );
            index++;
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
        if (key === "basic") {
          const basicColors = colorMode.basic;
          let index = 1;
          for (const [basicKey, basicColor] of Object.entries(basicColors)) {
            if (Array.isArray(basicColor)) {
              const [colorValue, alphaValue] = basicColor;
              result.push(
                generateSketchColor(
                  "basic",
                  index,
                  basicKey,
                  colorValue,
                  alphaValue,
                ),
              );
              index++;
            }
          }
        } else if (key !== "background") {
          const semanticColors = colorMode[key];
          let index = 1;
          for (const [alias, color] of Object.entries(semanticColors)) {
            if (Array.isArray(color)) {
              const [colorValue, alphaValue] = color;
              result.push(
                generateSketchColor(key, index, alias, colorValue, alphaValue),
              );
              index++;
            }
          }

          if (
            semanticColors.expand &&
            typeof semanticColors.expand === "object"
          ) {
            for (const [alias, expandColor] of Object.entries(
              semanticColors.expand,
            )) {
              if (expandColor && Array.isArray(expandColor)) {
                const [colorValue, alphaValue] = expandColor;
                result.push(
                  generateSketchColor(
                    key,
                    index,
                    alias,
                    colorValue,
                    alphaValue,
                  ),
                );
                index++;
              }
            }
          }
        }
      }
    }

    return result;
  }

  // 处理输出结果
  function processOutput() {
    const lightModeColors = processColorMode(
      inputData.schemeToken?.light || {},
    );
    const darkModeColors = processColorMode(inputData.schemeToken?.dark || {});

    console.log("const lightModeColors = {");
    console.log(lightModeColors.join("\n"));
    console.log("};");

    console.log("\nconst darkModeColors = {");
    console.log(darkModeColors.join("\n"));
    console.log("};");
  }

  processOutput();
} catch (error) {
  console.error("Error:", error.message);
}
