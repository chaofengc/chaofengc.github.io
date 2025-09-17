/**
 * BibTeX解析器
 * 用于解析BibTeX格式的文献引用
 */
class BibtexParser {
  constructor() {
    this.entries = [];
    this.errors = [];
  }

  /**
   * 解析BibTeX文本
   * @param {string} bibtex BibTeX格式的文本
   * @returns {Array} 解析后的条目数组
   */
  parse(bibtex) {
    this.entries = [];
    this.errors = [];
    
    // 移除注释
    bibtex = bibtex.replace(/%.*$/gm, '');
    
    // 查找所有条目
    const entryRegex = /@(\w+)\s*{\s*([^,]*),\s*([\s\S]*?)(?=\s*@|\s*$)/g;
    let match;
    
    while ((match = entryRegex.exec(bibtex)) !== null) {
      try {
        const type = match[1].toLowerCase();
        const citeKey = match[2].trim();
        const content = match[3].trim();
        
        // 只处理文章、会议论文、图书等
        if (['article', 'inproceedings', 'conference', 'book', 'techreport', 'phdthesis', 'mastersthesis', 'misc'].includes(type)) {
          const fields = this.parseFields(content);
          
          this.entries.push({
            type,
            citeKey,
            ...fields
          });
        }
      } catch (error) {
        this.errors.push(`解析错误: ${error.message}`);
      }
    }
    
    return this.entries;
  }
  
  /**
   * 解析BibTeX条目中的字段
   * @param {string} content 条目内容
   * @returns {Object} 解析后的字段对象
   */
  parseFields(content) {
    const fields = {};
    const fieldRegex = /(\w+)\s*=\s*[{"](.*?)[\"}]/g;
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(content)) !== null) {
      const fieldName = fieldMatch[1].toLowerCase();
      const fieldValue = fieldMatch[2].trim();
      fields[fieldName] = fieldValue;
    }
    
    return fields;
  }
  
  /**
   * 获取解析后的条目
   * @returns {Array} 条目数组
   */
  getEntries() {
    return this.entries;
  }
  
  /**
   * 获取解析错误
   * @returns {Array} 错误信息数组
   */
  getErrors() {
    return this.errors;
  }
  
  /**
   * 按年份排序条目（降序）
   * @returns {Array} 排序后的条目数组
   */
  sortByYear() {
    return this.entries.sort((a, b) => {
      const yearA = parseInt(a.year || '0');
      const yearB = parseInt(b.year || '0');
      return yearB - yearA;
    });
  }
  
  /**
   * 按类型过滤条目
   * @param {string} type 条目类型
   * @returns {Array} 过滤后的条目数组
   */
  filterByType(type) {
    if (type === 'all') {
      return this.entries;
    }
    
    const typeMap = {
      'journal': ['article'],
      'conference': ['inproceedings', 'conference'],
      'preprint': ['misc', 'unpublished']
    };
    
    const types = typeMap[type] || [type];
    return this.entries.filter(entry => types.includes(entry.type));
  }
}

// 导出解析器
window.BibtexParser = BibtexParser;