// CollectionManager.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

const CollectionManager = ({ 
  fieldConfig, 
  value = [], 
  onChange, 
  editing,
  path,
  formData = {}
}) => {
  const prevValueRef = useRef(value);

  const normalizeData = useCallback((data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const hasCollectionAttrs = Object.keys(data).some(key => 
      key.startsWith('@') || key === 'protocol' || key === 'type'
    );
    return hasCollectionAttrs ? [data] : [];
  }, []);

  const normalizedValue = useMemo(() => normalizeData(value), [value, normalizeData]);

  const [items, setItems] = useState(() => normalizedValue);
  const [expandedItems, setExpandedItems] = useState({});

  // Синхронизируем items с внешним value, избегая циклического обновления
  useEffect(() => {
    if (JSON.stringify(prevValueRef.current) !== JSON.stringify(value)) {
      setItems(normalizedValue);
      prevValueRef.current = value;
    }
  }, [value, normalizedValue]);

  const shouldShowField = useCallback((field, item, itemIndex) => {
    const { key, dependsOn } = field;
    if (!dependsOn) return true;

    let depValue;
    if (dependsOn.key.includes('@') || dependsOn.key.includes('.')) {
      depValue = formData[`${path}[${itemIndex}].${dependsOn.key}`];
      if (depValue === undefined) depValue = item[dependsOn.key];
    } else {
      depValue = item[dependsOn.key];
    }

    const currentValue = item[key];
    if (currentValue && currentValue.trim && currentValue.trim() !== '') return true;

    if (dependsOn.notEmpty) return depValue && depValue.trim && depValue.trim() !== '';
    if (dependsOn.value !== undefined) return depValue === dependsOn.value;

    return true;
  }, [formData, path]);

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
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

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

  const renderFieldsWithDependencies = useCallback((fields, item, itemIndex, parentPath = '') => {
    const visibleFields = fields.filter(field => shouldShowField(field, item, itemIndex));
    const independentFields = visibleFields.filter(f => !f.dependsOn);

    const renderDependentFields = (parentFieldKey) => {
      const dependentFields = visibleFields.filter(f => f.dependsOn && f.dependsOn.key === parentFieldKey);
      if (!dependentFields.length) return null;

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
            <div className="param-row">
              <label className="param-label">{field.label}</label>
              <div className="param-control">{renderField(field, item, itemIndex, parentPath)}</div>
            </div>
            {renderDependentFields(field.key)}
          </div>
        ))}
      </>
    );
  }, [shouldShowField, renderField]);

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

// === NestedCollectionContainer ===
const NestedCollectionContainer = ({ field, value, item, index, handleItemChange, editing, path }) => {
  const floatingRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState('auto');

  const normalizeNestedData = (data) => (!data ? [] : Array.isArray(data) ? data : [data]);

  const updateContainerHeight = () => {
    if (floatingRef.current) {
      setContainerHeight(floatingRef.current.offsetHeight);
    }
  };

  useEffect(() => {
    updateContainerHeight();

    const resizeObserver = new ResizeObserver(updateContainerHeight);
    const mutationObserver = new MutationObserver(updateContainerHeight);

    if (floatingRef.current) {
      resizeObserver.observe(floatingRef.current);
      mutationObserver.observe(floatingRef.current, { childList: true, subtree: true, attributes: true, characterData: true });
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [value, item, index]);

  return (
    <div className="nested-collection-container" style={{ height: containerHeight }}>
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

// === SubCollectionManager ===
const SubCollectionManager = ({ fieldConfig, value = [], onChange, editing, path, parentItem = {}, formData = {} }) => {
  const normalizeSubData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => {
      const normalized = { ...item };
      const template = fieldConfig.template || {};
      Object.entries(template).forEach(([key, templateValue]) => {
        if (Array.isArray(templateValue)) {
          normalized[key] = Array.isArray(normalized[key]) ? normalized[key] : normalized[key] ? [normalized[key]] : [];
        } else if (typeof templateValue === 'object' && templateValue !== null) {
          normalized[key] = normalized[key] && !Array.isArray(normalized[key]) ? normalized[key] : normalized[key] ? normalized[key][0] || {} : {};
        }
      });
      return normalized;
    });
  };

  const [items, setItems] = useState(() => normalizeSubData(value));

  useEffect(() => {
    setItems(normalizeSubData(value));
  }, [value]);

  const shouldShowField = (field, item, itemIndex) => {
    const { key, dependsOn } = field;
    if (!dependsOn) return true;

    let depValue;
    if (dependsOn.key.startsWith('parent.')) {
      depValue = parentItem[dependsOn.key.replace('parent.', '')];
    } else if (dependsOn.key.includes('@') || dependsOn.key.includes('.')) {
      depValue = formData[`${path}[${itemIndex}].${dependsOn.key}`] ?? item[dependsOn.key];
    } else {
      depValue = item[dependsOn.key];
    }

    const currentValue = item[key];
    if (currentValue && currentValue.trim && currentValue.trim() !== '') return true;
    if (dependsOn.notEmpty) return depValue && depValue.trim && depValue.trim() !== '';
    if (dependsOn.value !== undefined) return depValue === dependsOn.value;

    return true;
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

  const renderFieldsWithDependencies = (fields, item, itemIndex, parentPath = '') => {
    const visibleFields = fields.filter(field => shouldShowField(field, item, itemIndex));
    const independentFields = visibleFields.filter(f => !f.dependsOn);

    const renderDependentFields = (parentFieldKey) => {
      const dependentFields = visibleFields.filter(f => f.dependsOn && f.dependsOn.key === parentFieldKey);
      if (!dependentFields.length) return null;

      return (
        <div className="dependent-fields-group">
          {dependentFields.map(field => (
            <div key={field.key}>
              <div className="param-row dependent-field">
                <ChevronRight size={16} className="dependency-icon" />
                <label className="param-label">{field.label}</label>
                <div className="param-control">
                  {field.type === 'select' ? editing ? (
                    <select
                      value={item[field.key] || ''}
                      onChange={(e) => handleItemChange(itemIndex, field.key, e.target.value)}
                      className="param-input"
                    >
                      <option value="">Not set</option>
                      {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
            <div className="param-row">
              <label className="param-label">{field.label}</label>
              <div className="param-control">
                {field.type === 'select' ? editing ? (
                  <select
                    value={item[field.key] || ''}
                    onChange={(e) => handleItemChange(itemIndex, field.key, e.target.value)}
                    className="param-input"
                  >
                    <option value="">Not set</option>
                    {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
            </div>
            {renderDependentFields(field.key)}
          </div>
        ))}
      </>
    );
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