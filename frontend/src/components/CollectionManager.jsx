// CollectionManager.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2, ChevronRight } from 'lucide-react';

const CollectionManager = ({ 
  fieldConfig, 
  value = [], 
  onChange, 
  editing,
  path,
  formData = {}
}) => {
  // Используем useRef для отслеживания предыдущего значения
  const prevValueRef = useRef(value);

  // Мемоизируем функцию нормализации
  const normalizeData = useCallback((data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    
    // Проверяем, есть ли ключи, которые выглядят как атрибуты коллекции
    const hasCollectionAttrs = Object.keys(data).some(key => 
      key.startsWith('@') || key === 'protocol' || key === 'type'
    );
    
    if (hasCollectionAttrs) {
      return [data];
    }
    
    return [];
  }, []);

  // Мемоизируем нормализованное значение
  const normalizedValue = useMemo(() => normalizeData(value), [value, normalizeData]);

  const [items, setItems] = useState(() => normalizedValue);
  const [expandedItems, setExpandedItems] = useState({});

  // Обновляем items только если значение действительно изменилось
  useEffect(() => {
    // Сравниваем предыдущее значение с текущим
    if (JSON.stringify(prevValueRef.current) !== JSON.stringify(normalizedValue)) {
      setItems(normalizedValue);
      prevValueRef.current = normalizedValue;
    }
  }, [normalizedValue]);

  // Мемоизируем функцию проверки зависимости
  const shouldShowField = useCallback((field, item, itemIndex) => {
    const { key, dependsOn } = field;
    if (!dependsOn) return true;

    let depValue;
    if (dependsOn.key.includes('@') || dependsOn.key.includes('.')) {
      depValue = formData[`${path}[${itemIndex}].${dependsOn.key}`];
      if (depValue === undefined) {
        depValue = item[dependsOn.key];
      }
    } else {
      depValue = item[dependsOn.key];
    }
    
    const currentValue = item[key];
    
    if (currentValue && currentValue.trim && currentValue.trim() !== '') {
      return true;
    }
    
    if (dependsOn.notEmpty) {
      return depValue && depValue.trim && depValue.trim() !== '';
    } else if (dependsOn.value !== undefined) {
      return depValue === dependsOn.value;
    }
    
    return true;
  }, [formData, path]);

  // Мемоизируем функции обработчиков
  const handleAddItem = useCallback(() => {
    const newItem = JSON.parse(JSON.stringify(fieldConfig.template));
    const newItems = [...items, newItem];
    setItems(newItems);
    onChange(path, newItems);
  }, [items, fieldConfig.template, onChange, path]);

  const handleRemoveItem = useCallback((index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange(path, newItems);
  }, [items, onChange, path]);

  const handleItemChange = useCallback((index, fieldPath, fieldValue) => {
    const newItems = [...items];
    const item = newItems[index];
    
    const pathParts = fieldPath.split('.');
    let current = item;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) current[pathParts[i]] = {};
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = fieldValue;
    
    setItems(newItems);
    onChange(path, newItems);
  }, [items, onChange, path]);

  const toggleExpand = useCallback((index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  // Мемоизируем функцию рендеринга полей
  const renderFieldsWithDependencies = useCallback((fields, item, itemIndex, parentPath = '') => {
    const visibleFields = fields.filter(field => shouldShowField(field, item, itemIndex));
    const independentFields = visibleFields.filter(f => !f.dependsOn);
    
    const renderDependentFields = (parentFieldKey) => {
      const dependentFields = visibleFields.filter(f => f.dependsOn && f.dependsOn.key === parentFieldKey);
      
      if (dependentFields.length === 0) return null;
      
      return (
        <div className="dependent-fields-group">
          {dependentFields.map(field => (
            <div key={field.key}>
              <div className="param-row dependent-field">
                <ChevronRight size={16} className="dependency-icon" />
                <label className="param-label">{field.label}</label>
                <div className="param-control">
                  {renderField(field, item, itemIndex, parentPath)}
                </div>
              </div>
              {renderDependentFields(field.key)}
            </div>
          ))}
        </div>
      );
    };

    return (
      <>
        {independentFields.map(field => (
          <div key={field.key}>
            <div className="param-row dependent-field">
              <label className="param-label">{field.label}</label>
              <div className="param-control">
                {renderField(field, item, itemIndex, parentPath)}
              </div>
            </div>
            {renderDependentFields(field.key)}
          </div>
        ))}
      </>
    );
  }, [shouldShowField]);

  // Мемоизируем функцию рендеринга поля
  const renderField = useCallback((field, item, index, parentPath = '') => {
    const value = field.key.split('.').reduce((obj, key) => obj?.[key], item) || '';

    if (field.type === 'select') {
      return editing ? (
        <select
          value={value}
          onChange={(e) => handleItemChange(index, field.key, e.target.value)}
          className="param-input"
        >
          <option value="">Not set</option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <span className={`param-value ${!value ? 'empty' : ''}`}>
          {field.options.find(opt => opt.value === value)?.label || value || 'Not set'}
        </span>
      );
    }

    if (field.type === 'subcollection') {
      return (
        <NestedCollectionContainer
          field={field}
          value={value}
          item={item}
          index={index}
          handleItemChange={handleItemChange}
          editing={editing}
          path={field.key}
        />
      );
    }

    return editing ? (
      <input
        type={field.type || 'text'}
        value={value}
        onChange={(e) => handleItemChange(index, field.key, e.target.value)}
        className="param-input"
        placeholder={field.placeholder}
      />
    ) : (
      <span className={`param-value ${!value ? 'empty' : ''}`}>
        {value || 'Not set'}
      </span>
    );
  }, [editing, handleItemChange]);

  return (
    <div className="collection-manager">
      <div className="collection-header">
        <label className="param-label">{fieldConfig.label}</label>
        {editing && (
          <button onClick={handleAddItem} className="btn btn-small btn-primary">
            <Plus size={14} /> Add {fieldConfig.itemType}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="collection-empty">No items configured</div>
      ) : (
        <div className="collection-items">
          {items.map((item, index) => (
            <div key={index} className={`collection-item ${expandedItems[index] ? 'expanded' : ''}`}>
              <div className="collection-item-header">
                <button className="expand-btn" onClick={() => toggleExpand(index)}>
                  {expandedItems[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <span className="item-title param-value">
                  {item['@mountname'] || item['@name'] || item['@id'] || `${fieldConfig.itemType} ${index + 1}`}
                </span>
                {editing && (
                  <button onClick={() => handleRemoveItem(index)} className="btn btn-small btn-warning">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              
              {expandedItems[index] && (
                <div className="collection-item-fields">
                  {renderFieldsWithDependencies(fieldConfig.fields, item, index, `${path}[${index}]`)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент для вложенной коллекции с автоматическим вычислением высоты
const NestedCollectionContainer = ({ field, value, item, index, handleItemChange, editing, path }) => {
  const floatingRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState('auto');

  // Функция для нормализации вложенных данных
  const normalizeNestedData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return [data]; // Если пришел объект, превращаем в массив с одним элементом
  };

  // Функция для обновления высоты контейнера
  const updateContainerHeight = () => {
    if (floatingRef.current) {
      const height = floatingRef.current.offsetHeight;
      // Добавляем небольшой отступ для красоты
      setContainerHeight(height);
    }
  };

  // Обновляем высоту при изменении контента или значения
  useEffect(() => {
    updateContainerHeight();

    // Создаем ResizeObserver для отслеживания изменений размера
    const resizeObserver = new ResizeObserver(updateContainerHeight);
    if (floatingRef.current) {
      resizeObserver.observe(floatingRef.current);
    }

    // Также наблюдаем за изменениями в DOM (добавление/удаление элементов)
    const mutationObserver = new MutationObserver(updateContainerHeight);
    if (floatingRef.current) {
      mutationObserver.observe(floatingRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [value, item, index]); // Пересчитываем при изменении данных

  return (
    <div 
      className="nested-collection-container"
      style={{ height: containerHeight }}
    >
      <div ref={floatingRef} className="nested-collection-floating">
        <SubCollectionManager
          fieldConfig={field}
          value={normalizeNestedData(value)}
          onChange={(subPath, subValue) => handleItemChange(index, field.key, subValue)}
          editing={editing}
          path={`${field.key}`}
          parentItem={item}
        />
      </div>
    </div>
  );
};

// Подкомпонент для управления вложенными коллекциями (например, type внутри device)
const SubCollectionManager = ({ fieldConfig, value = [], onChange, editing, path, parentItem = {}, formData = {} }) => {
  // Функция для нормализации вложенных данных на основе шаблона
  const normalizeSubData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => {
      const normalized = { ...item };
      const template = fieldConfig.template || {};
      
      // Проходим по всем ключам шаблона
      Object.entries(template).forEach(([key, templateValue]) => {
        // Если в шаблоне это массив, а в данных это объект или примитив
        if (Array.isArray(templateValue)) {
          if (normalized[key] && !Array.isArray(normalized[key])) {
            normalized[key] = [normalized[key]];
          } else if (!normalized[key]) {
            normalized[key] = [];
          }
        }
        
        // Если в шаблоне это объект, а в данных это массив
        if (typeof templateValue === 'object' && !Array.isArray(templateValue) && templateValue !== null) {
          if (normalized[key] && Array.isArray(normalized[key])) {
            normalized[key] = normalized[key][0] || {};
          } else if (!normalized[key]) {
            normalized[key] = {};
          }
        }
      });
      
      return normalized;
    });
  };

  const [items, setItems] = useState(() => normalizeSubData(value));

  // Обновляем items при изменении value
  useEffect(() => {
    setItems(normalizeSubData(value));
  }, [value]);

  // Функция проверки зависимости поля для SubCollectionManager
  const shouldShowField = (field, item, itemIndex) => {
    const { key, dependsOn } = field;
    if (!dependsOn) return true;

    // Для подколлекций, значения могут быть из родительского элемента или из текущего
    let depValue;
    
    // Проверяем, есть ли зависимость от родительского поля
    if (dependsOn.key.startsWith('parent.')) {
      // Зависимость от поля родителя
      const parentKey = dependsOn.key.replace('parent.', '');
      depValue = parentItem[parentKey];
    } else if (dependsOn.key.includes('@') || dependsOn.key.includes('.')) {
      // Это вложенный путь, ищем в formData
      depValue = formData[`${path}[${itemIndex}].${dependsOn.key}`];
      if (depValue === undefined) {
        // Проверяем также в item
        depValue = item[dependsOn.key];
      }
    } else {
      // Простое имя поля в item
      depValue = item[dependsOn.key];
    }
    
    const currentValue = item[key];
    
    if (currentValue && currentValue.trim && currentValue.trim() !== '') {
      return true;
    }
    
    if (dependsOn.notEmpty) {
      return depValue && depValue.trim && depValue.trim() !== '';
    } else if (dependsOn.value !== undefined) {
      return depValue === dependsOn.value;
    }
    
    return true;
  };

  // Рекурсивный рендеринг полей с учетом зависимостей для SubCollectionManager
  const renderFieldsWithDependencies = (fields, item, itemIndex, parentPath = '') => {
    // Сначала отфильтровываем поля, которые не должны показываться
    const visibleFields = fields.filter(field => shouldShowField(field, item, itemIndex));
    
    // Группируем независимые поля
    const independentFields = visibleFields.filter(f => !f.dependsOn);
    
    // Функция для рекурсивного рендеринга зависимых полей
    const renderDependentFields = (parentFieldKey) => {
      const dependentFields = visibleFields.filter(f => f.dependsOn && f.dependsOn.key === parentFieldKey);
      
      if (dependentFields.length === 0) return null;
      
      return (
        <div className="dependent-fields-group">
          {dependentFields.map(field => {
            const fullPath = parentPath ? `${parentPath}.${field.key}` : `${path}[${itemIndex}].${field.key}`;
            return (
              <div key={field.key}>
                <div className="param-row dependent-field">
                  <ChevronRight size={16} className="dependency-icon" />
                  <label className="param-label">{field.label}</label>
                  {field.type === 'select' ? editing ? (
                    <select
                      value={item[field.key] || ''}
                      onChange={(e) => handleItemChange(itemIndex, field.key, e.target.value)}
                      className="param-input"
                    >
                      <option value="">Not set</option>
                      {field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`param-value ${!item[field.key] ? 'empty' : ''}`}>
                      {field.options.find(opt => opt.value === item[field.key])?.label || item[field.key] || 'Not set'}
                    </span>
                  ) : editing ? (
                    <input
                      type={field.type || 'text'}
                      value={item[field.key] || ''}
                      onChange={(e) => handleItemChange(itemIndex, field.key, e.target.value)}
                      className="param-input"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <span className={`param-value ${!item[field.key] ? 'empty' : ''}`}>
                      {item[field.key] || 'Not set'}
                    </span>
                  )}
                </div>
                {/* Рекурсивно рендерим поля, зависящие от этого поля */}
                {renderDependentFields(field.key)}
              </div>
            )
          })}
        </div>
      );
    };

    return (
      <>
        {/* Независимые поля */}
        {independentFields.map(field => {
          const fullPath = parentPath ? `${parentPath}.${field.key}` : `${path}[${itemIndex}].${field.key}`;
          return (
            <div key={field.key}>
              <div className="param-row">
                <label className="param-label">{field.label}</label>
                {field.type === 'select' ? editing ? (
                  <select
                    value={item[field.key] || ''}
                    onChange={(e) => handleItemChange(itemIndex, field.key, e.target.value)}
                    className="param-input"
                  >
                    <option value="">Not set</option>
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`param-value ${!item[field.key] ? 'empty' : ''}`}>
                    {field.options.find(opt => opt.value === item[field.key])?.label || item[field.key] || 'Not set'}
                  </span>
                ) : editing ? (
                  <input
                    type={field.type || 'text'}
                    value={item[field.key] || ''}
                    onChange={(e) => handleItemChange(itemIndex, field.key, e.target.value)}
                    className="param-input"
                    placeholder={field.placeholder}
                  />
                ) : (
                  <span className={`param-value ${!item[field.key] ? 'empty' : ''}`}>
                    {item[field.key] || 'Not set'}
                  </span>
                )}
              </div>
              {/* Рекурсивно рендерим поля, зависящие от этого поля */}
              {renderDependentFields(field.key)}
            </div>
          );
        })}
      </>
    );
  };

  const handleAddItem = () => {
    const newItem = JSON.parse(JSON.stringify(fieldConfig.template));
    const newItems = [...items, newItem];
    setItems(newItems);
    onChange(path, newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange(path, newItems);
  };

  const handleItemChange = (index, fieldKey, fieldValue) => {
    const newItems = [...items];
    newItems[index][fieldKey] = fieldValue;
    setItems(newItems);
    onChange(path, newItems);
  };

  return (
    <div className="subcollection">
      <div className="subcollection-header">
        <label className="param-label">{fieldConfig.label}</label>
        {editing && (
          <button onClick={handleAddItem} className="btn btn-small btn-primary">
            <Plus size={12} /> Add
          </button>
        )}
      </div>
      
      {items.length === 0 ? (
        <div className="collection-empty">No items</div>
      ) : (
        items.map((item, index) => (
          <div key={index} className="subcollection-item">
            <div className="subcollection-item-fields">
              {renderFieldsWithDependencies(fieldConfig.fields, item, index, `${path}[${index}]`)}
            </div>
            {editing && (
              <button onClick={() => handleRemoveItem(index)} className="btn btn-small btn-warning">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default CollectionManager;