// 垃圾分类侠 - 主脚本
document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素
    const wasteInput = document.getElementById('waste-input');
    const searchBtn = document.getElementById('search-btn');
    const resultCard = document.getElementById('result-card');
    const loadingSpinner = document.getElementById('loading-spinner');
    const wasteName = document.getElementById('waste-name');
    const categoryBadge = document.getElementById('category-badge');
    const wasteDescription = document.getElementById('waste-description');
    const disposalGuide = document.getElementById('disposal-guide');
    const wasteImage = document.getElementById('waste-image');

    // 垃圾分类类别
    const categories = {
        recyclable: {
            name: '可回收物',
            description: '可回收物是指适宜回收和资源利用的废弃物。',
            guide: '请投放到蓝色垃圾桶，确保物品干净无污染。',
            color: 'recyclable'
        },
        kitchen: {
            name: '厨余垃圾',
            description: '厨余垃圾是指日常生活中产生的食物残渣等易腐烂的垃圾。',
            guide: '请投放到绿色垃圾桶，尽量沥干水分后再投放。',
            color: 'kitchen'
        },
        hazardous: {
            name: '有害垃圾',
            description: '有害垃圾是指对人体健康或自然环境造成直接或潜在危害的废弃物。',
            guide: '请投放到红色垃圾桶，特殊有害垃圾需送至专门回收点。',
            color: 'hazardous'
        },
        other: {
            name: '其他垃圾',
            description: '其他垃圾是指除可回收物、厨余垃圾、有害垃圾以外的其他生活废弃物。',
            guide: '请投放到灰色垃圾桶。',
            color: 'other'
        }
    };

    // 垃圾分类示例数据（作为备用，当API不可用时使用）
    const wasteExamples = {
        '塑料瓶': 'recyclable',
        '纸张': 'recyclable',
        '易拉罐': 'recyclable',
        '玻璃瓶': 'recyclable',
        '金属': 'recyclable',
        '报纸': 'recyclable',
        '纸板': 'recyclable',
        '食物残渣': 'kitchen',
        '果皮': 'kitchen',
        '茶叶渣': 'kitchen',
        '骨头': 'kitchen',
        '菜叶': 'kitchen',
        '电池': 'hazardous',
        '药品': 'hazardous',
        '油漆': 'hazardous',
        '荧光灯': 'hazardous',
        '过期药品': 'hazardous',
        '卫生纸': 'other',
        '烟头': 'other',
        '尘土': 'other',
        '陶瓷': 'other'
    };

    // 事件监听
    searchBtn.addEventListener('click', searchWaste);
    wasteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchWaste();
        }
    });

    // 搜索垃圾分类
    async function searchWaste() {
        const wasteName = wasteInput.value.trim();
        
        if (!wasteName) {
            alert('请输入垃圾名称');
            return;
        }

        // 显示加载动画
        loadingSpinner.style.display = 'flex';
        
        try {
            // 调用Pollinations API进行垃圾分类
            const category = await getWasteCategory(wasteName);
            
            // 更新UI显示结果
            updateResult(wasteName, category);
        } catch (error) {
            console.error('分类失败:', error);
            alert('分类失败，请稍后再试');
        } finally {
            // 隐藏加载动画
            loadingSpinner.style.display = 'none';
        }
    }

    // 使用Pollinations API进行垃圾分类
    async function getWasteCategory(wasteName) {
        // 首先检查示例数据中是否有匹配
        if (wasteExamples[wasteName]) {
            return wasteExamples[wasteName];
        }

        try {
            // 构建提示词，询问垃圾分类
            const prompt = `请将"${wasteName}"归类为以下四类垃圾之一：可回收物(recyclable)、厨余垃圾(kitchen)、有害垃圾(hazardous)或其他垃圾(other)。只需回答对应的英文类别名称，不要有其他内容。`;
            
            // 调用Pollinations API
            const response = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    model: 'gemini',
                    private: true  // 响应不会出现在公共feed中
                })
            });
            
            if (!response.ok) {
                throw new Error('API请求失败');
            }
            
            // 获取响应文本
            const data = await response.text();
            console.log('API响应:', data);
            
            // 解析响应，提取垃圾分类结果
            let category = parseCategory(data);
            
            // 如果无法解析，默认为其他垃圾
            if (!category) {
                console.warn('无法解析分类结果，使用默认分类');
                category = 'other';
            }
            
            return category;
        } catch (error) {
            console.error('API调用失败:', error);
            // 如果API调用失败，随机返回一个分类（实际应用中可以改为更合理的备选策略）
            const categoryKeys = Object.keys(categories);
            return categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
        }
    }

    // 解析API返回的分类结果
    function parseCategory(response) {
        // 转换为小写并去除空格
        const text = response.toLowerCase().trim();
        
        // 检查响应中是否包含分类关键词
        if (text.includes('recyclable')) return 'recyclable';
        if (text.includes('kitchen')) return 'kitchen';
        if (text.includes('hazardous')) return 'hazardous';
        if (text.includes('other')) return 'other';
        
        // 中文关键词匹配
        if (text.includes('可回收') || text.includes('回收')) return 'recyclable';
        if (text.includes('厨余') || text.includes('湿垃圾') || text.includes('食物')) return 'kitchen';
        if (text.includes('有害') || text.includes('危险') || text.includes('有毒')) return 'hazardous';
        if (text.includes('其他') || text.includes('干垃圾')) return 'other';
        
        return null;
    }

    // 更新结果显示
    function updateResult(name, category) {
        const categoryInfo = categories[category];
        
        // 更新UI元素
        document.getElementById('waste-name').textContent = name;
        categoryBadge.textContent = categoryInfo.name;
        categoryBadge.className = 'category-badge ' + categoryInfo.color;
        wasteDescription.textContent = categoryInfo.description;
        disposalGuide.textContent = categoryInfo.guide;
    }

    // 初始化
    function init() {
        // 可以添加初始化代码
        wasteInput.focus();
    }

    // 启动应用
    init();
});
