const fs = require("fs");
const YAML = require("js-yaml");
const path = require("path");

try {
  // 读取 YAML 文件并解析为 JavaScript 对象
  const inputData = YAML.load(
    fs.readFileSync(path.join(__dirname, "../beluga-color-token.yml"), "utf8"),
  );

  // 根据 major 和 alias 生成 jsonP 格式的颜色变量
  function generateJsonPColor(major, index, alias, color, alpha) {
    return `"${major}-${index}-${alias}": ["${color}", ${alpha}]`;
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
            generateJsonPColor(major, index, alias, colorValue, alphaValue),
          );
          index++;
        }
      }

      if (colors.expand && typeof colors.expand === "object") {
        const expandAliases =
          inputData.outputConfig?.general?.alias?.expand || [];
        for (const [alias, expandColor] of Object.entries(colors.expand)) {
          if (Array.isArray(expandColor) && expandAliases.includes(alias)) {
            const [colorValue, alphaValue] = expandColor;
            result.push(
              generateJsonPColor(major, index, alias, colorValue, alphaValue),
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
    const result = {};

    for (const key in colorMode) {
      if (colorMode[key] && typeof colorMode[key] === "object") {
        if (key === "basic") {
          const basicColors = colorMode.basic;
          let index = 1;
          for (const [basicAlias, basicColor] of Object.entries(basicColors)) {
            if (Array.isArray(basicColor)) {
              const [colorValue, alphaValue] = basicColor;
              result[`${key}-${index}-${basicAlias}`] = [
                colorValue,
                alphaValue,
              ];
              index++;
            }
          }
        } else {
          const semanticColors = colorMode[key];
          let index = 1;
          for (const [alias, color] of Object.entries(semanticColors)) {
            if (Array.isArray(color)) {
              const [colorValue, alphaValue] = color;
              result[`${key}-${index}-${alias}`] = [
                `${colorValue}`,
                alphaValue,
              ];
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
              if (Array.isArray(expandColor)) {
                const [colorValue, alphaValue] = expandColor;
                result[`${key}-${index}-${alias}`] = [
                  `${colorValue}`,
                  alphaValue,
                ];
                index++;
              }
            }
          }
        }
      }
    }

    return result;
  }

  // 转换为驼峰命名法，并移除索引
  function convertKeysAndRemoveIndexes(colors) {
    const result = {};

    function toCamelCase(str) {
      return str.replace(/-./g, (x) => x[1].toUpperCase()).replace(/-.?$/, "");
    }

    for (const [key, value] of Object.entries(colors)) {
      const newKey = toCamelCase(key.replace(/\d+-/, ""));
      result[newKey] = value;
    }

    return result;
  }

  // 处理输出结果
  function processOutput() {
    const lightModeColors = processColorMode(
      inputData.schemeToken?.light || {},
    );
    const darkModeColors = processColorMode(inputData.schemeToken?.dark || {});

    const convertedLightModeColors =
      convertKeysAndRemoveIndexes(lightModeColors);
    const convertedDarkModeColors = convertKeysAndRemoveIndexes(darkModeColors);

    console.log("const lightModeColors = {");
    console.log(
      Object.entries(convertedLightModeColors)
        .map(([key, value]) => `"${key}": ${JSON.stringify(value)}`)
        .join(",\n"),
    );
    console.log("};");

    console.log("\nconst darkModeColors = {");
    console.log(
      Object.entries(convertedDarkModeColors)
        .map(([key, value]) => `"${key}": ${JSON.stringify(value)}`)
        .join(",\n"),
    );
    console.log("};");
  }

  processOutput();
} catch (error) {
  console.error("Error:", error.message);
}
