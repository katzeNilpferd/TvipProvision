// CollectionManager.jsx
import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

const CollectionManager = ({ 
  fieldConfig, 
  value = [], 
  onChange, 
  editing,
  path 
}) => {
  const [items, setItems] = useState(value || []);
  const [expandedItems, setExpandedItems] = useState({});
    
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
    const fullPath = parentPath ? `${parentPath}.${field.key}` : field.key;
    const value = field.key.split('.').reduce((obj, key) => obj?.[key], item) || '';

    if (field.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => handleItemChange(index, field.key, e.target.value)}
          className="param-input"
          disabled={!editing}
        >
          <option value="">Not set</option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'subcollection') {
      return (
        <div className="nested-collection">
          <h5>{field.label}</h5>
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

    return (
      <input
        type={field.type || 'text'}
        value={value}
        onChange={(e) => handleItemChange(index, field.key, e.target.value)}
        className="param-input"
        disabled={!editing}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <div className="collection-manager">
      <div className="collection-header">
        <h4>{fieldConfig.label}</h4>
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
                <span className="item-title">
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
                  {fieldConfig.fields.map(field => (
                    <div key={field.key} className="param-row dependent-field">
                      <label className="param-label">{field.label}</label>
                      <div className="param-control">
                        {renderField(field, item, index)}
                        {field.description && (
                          <span className="field-description">{field.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
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
const SubCollectionManager = ({ fieldConfig, value = [], onChange, editing, path }) => {
  const [items, setItems] = useState(value || []);

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
        <span>{fieldConfig.label}</span>
        {editing && (
          <button onClick={handleAddItem} className="btn btn-small btn-primary">
            <Plus size={12} /> Add
          </button>
        )}
      </div>
      
      {items.map((item, index) => (
        <div key={index} className="subcollection-item">
          <div className="subcollection-item-fields">
            {fieldConfig.fields.map(field => (
              <div key={field.key} className="param-row">
                <label className="param-label">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={item[field.key] || ''}
                    onChange={(e) => handleItemChange(index, field.key, e.target.value)}
                    className="param-input"
                    disabled={!editing}
                  >
                    <option value="">Not set</option>
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={item[field.key] || ''}
                    onChange={(e) => handleItemChange(index, field.key, e.target.value)}
                    className="param-input"
                    disabled={!editing}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
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