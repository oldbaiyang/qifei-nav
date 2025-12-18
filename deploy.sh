#!/bin/bash

# 打印带颜色的日志
green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }

# 1. 执行构建脚本 (生成静态 HTML)
green "🚀 开始构建静态页面..."
node scripts/build.js
if [ $? -ne 0 ]; then
    red "❌ 构建失败，程序终止。"
    exit 1
fi
green "✅ 构建成功！"

# 2. Git 提交与推送
green "📦 正在添加更改..."
git add .

# 获取提交信息，如果没有参数则使用默认时间戳
MSG="$1"
if [ -z "$MSG" ]; then
    MSG="chore: update site content $(date '+%Y-%m-%d %H:%M:%S')"
fi

green "📝 正在提交，信息: '$MSG'"
git commit -m "$MSG"

green "⬆️  正在推送到 GitHub..."
git push

if [ $? -eq 0 ]; then
    green "🎉 部署成功！代码已同步到 GitHub。"
else
    red "❌ 推送失败，请检查网络或 Git 配置。"
    exit 1
fi
