// CollectionManager.jsx
import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2, ChevronRight } from 'lucide-react';

const CollectionManager = ({ 
  fieldConfig, 
  value = [], 
  onChange, 
  editing,
  path,
  formData = {}  // Добавляем formData для обработки зависимостей
}) => {
  const [items, setItems] = useState(value || []);
  const [expandedItems, setExpandedItems] = useState({});

  // Функция проверки зависимости поля
  const shouldShowField = (field, item, itemIndex) => {
    const { key, dependsOn } = field;
    if (!dependsOn) return true;

    // Для коллекций, значения находятся в formData по пути `${path}[${itemIndex}].${dependsOn.key}`
    // или просто в item если это поле внутри элемента коллекции
    let depValue;
    if (dependsOn.key.includes('@') || dependsOn.key.includes('.')) {
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

  // Рекурсивный рендеринг полей с учетом зависимостей
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
                  <div className="param-control">
                    {renderField(field, item, itemIndex, parentPath)}
                  </div>
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
              <div className="param-row dependent-field">
                <label className="param-label">{field.label}</label>
                <div className="param-control">
                  {renderField(field, item, itemIndex, parentPath)}
                </div>
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

  const handleItemChange = (index, fieldPath, fieldValue) => {
    const newItems = [...items];
    const item = newItems[index];
    
    // Поддержка вложенных путей (например, 'address.@value')
    const pathParts = fieldPath.split('.');
    let current = item;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) current[pathParts[i]] = {};
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = fieldValue;
    
    setItems(newItems);
    onChange(path, newItems);
  };

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderField = (field, item, index, parentPath = '') => {
    const fullPath = parentPath ? `${parentPath}.${field.key}` : `${path}[${index}].${field.key}`;
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
        <div className="nested-collection">
          <SubCollectionManager
            fieldConfig={field}
            value={value || []}
            onChange={(subPath, subValue) => handleItemChange(index, field.key, subValue)}
            editing={editing}
            path={`${field.key}`}
          />
        </div>
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
  };

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

// Подкомпонент для управления вложенными коллекциями (например, type внутри device)
const SubCollectionManager = ({ fieldConfig, value = [], onChange, editing, path, formData = {} }) => {
  const [items, setItems] = useState(value || []);

  // Функция проверки зависимости поля для SubCollectionManager
  const shouldShowField = (field, item, itemIndex) => {
    const { key, dependsOn } = field;
    if (!dependsOn) return true;

    // Для подколлекций, значения находятся в formData по пути `${path}[${itemIndex}].${dependsOn.key}`
    // или просто в item если это поле внутри элемента подколлекции
    let depValue;
    if (dependsOn.key.includes('@') || dependsOn.key.includes('.')) {
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
      
      {items.map((item, index) => (
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
      ))}
    </div>
  );
};

export default CollectionManager;