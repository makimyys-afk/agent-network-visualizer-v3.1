import { useState } from 'react';

const Button = ({ children, onClick, className = '', variant = 'primary', disabled = false }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:hover:bg-transparent'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

const ScenarioManager = ({
  currentScenario,
  onScenarioChange,
  onScenarioSave,
  onScenarioLoad,
  onScenarioDelete,
  scenarios,
  simulationParams
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);

  const handleSave = () => {
    if (!editingScenario.name.trim()) {
      alert('Введите название сценария');
      return;
    }

    const scenarioToSave = {
      ...editingScenario,
      id: editingScenario.id || Date.now().toString(),
      settings: simulationParams,
    };

    onScenarioSave(scenarioToSave);
    setIsEditing(false);
    setEditingScenario(null);
  };

  const handleEdit = (scenario) => {
    setEditingScenario(scenario);
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setEditingScenario({
      id: '',
      name: '',
      description: '',
      type: currentScenario || 'A',
      customLogic: '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingScenario(null);
  };
  
  const getScenarioTypeDescription = (type) => {
    switch (type) {
      case 'A':
        return 'Нейтральная повестка - темы выбираются случайно';
      case 'B':
        return 'Ценностно-близкая тема - темы приближены к центрам кластеров';
      case 'custom':
        return 'Пользовательский сценарий с собственной логикой';
      default:
        return 'Неизвестный тип сценария';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Управление сценариями</h3>
        {!isEditing && (
          <Button onClick={handleCreateNew} className="text-sm">
            Создать новый
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">
            {editingScenario.id ? 'Редактировать сценарий' : 'Создать новый сценарий'}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название сценария *</label>
              <input
                type="text"
                value={editingScenario.name}
                onChange={(e) => setEditingScenario({ ...editingScenario, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                value={editingScenario.description}
                onChange={(e) => setEditingScenario({ ...editingScenario, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип сценария</label>
              <select
                value={editingScenario.type}
                onChange={(e) => setEditingScenario({ ...editingScenario, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="A">A - Нейтральная повестка</option>
                <option value="B">B - Ценностно-близкая тема</option>
                <option value="custom">Пользовательский</option>
              </select>
            </div>
            {editingScenario.type === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пользовательская логика (JavaScript)</label>
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mb-2">
                  <strong>Внимание:</strong> этот код выполняется в вашем
                  браузере через <code>new Function</code>. Вставляйте только
                  код, которому доверяете — он получает доступ к DOM, cookie,
                  localStorage (включая сохранённые API-ключи) и может
                  отправлять запросы от вашего имени.
                </div>
                <textarea
                  value={editingScenario.customLogic}
                  onChange={(e) => setEditingScenario({ ...editingScenario, customLogic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows="6"
                />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="text-sm">Сохранить</Button>
              <Button onClick={handleCancel} variant="outline" className="text-sm">Отмена</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{scenario.name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{scenario.type}</span>
                  </div>
                  {scenario.description && <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>}
                  <p className="text-xs text-gray-500">{getScenarioTypeDescription(scenario.type)}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button onClick={() => onScenarioLoad(scenario)} variant="outline" className="text-xs px-2 py-1">Загрузить</Button>
                  <Button onClick={() => handleEdit(scenario)} variant="outline" className="text-xs px-2 py-1">Изменить</Button>
                  <Button onClick={() => onScenarioDelete(scenario.id)} variant="outline" className="text-xs px-2 py-1 text-red-600">Удалить</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenarioManager;
