import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { 
  FileText, Save, Upload, Download, Plus, Trash2, 
  Edit3, Play, Pause, RotateCcw, Zap, Brain 
} from 'lucide-react';
import TextVectorizer from './TextVectorizer';

const EnhancedScenarioManager = ({ 
  simulationParams, 
  onParamsChange,
  topicSettings,
  setTopicSettings,
  opinionSettings,
  setOpinionSettings,
  onError 
}) => {
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [editingScenario, setEditingScenario] = useState(null);
  const [showTextVectorizer, setShowTextVectorizer] = useState(false);
  const [autoGenerateTopics, setAutoGenerateTopics] = useState(false);

  // Предустановленные сценарии
  const presetScenarios = [
    {
      id: 'consensus',
      name: 'Поиск консенсуса',
      description: 'Агенты стремятся к общему мнению по всем темам',
      topics: 5,
      proximitySettings: {
        type: 'convergent',
        strength: 0.8
      },
      opinionDistribution: 'normal'
    },
    {
      id: 'polarization',
      name: 'Поляризация мнений',
      description: 'Формирование противоположных групп мнений',
      topics: 3,
      proximitySettings: {
        type: 'divergent',
        strength: 0.9
      },
      opinionDistribution: 'bimodal'
    },
    {
      id: 'echo_chambers',
      name: 'Эхо-камеры',
      description: 'Изолированные группы с усилением собственных взглядов',
      topics: 7,
      proximitySettings: {
        type: 'cluster_isolated',
        strength: 0.7
      },
      opinionDistribution: 'cluster_based'
    },
    {
      id: 'information_cascade',
      name: 'Информационный каскад',
      description: 'Быстрое распространение мнения через сеть',
      topics: 4,
      proximitySettings: {
        type: 'cascade',
        strength: 0.6
      },
      opinionDistribution: 'random'
    }
  ];

  useEffect(() => {
    // Инициализация с предустановленными сценариями
    setScenarios(presetScenarios);
    setCurrentScenario(presetScenarios[0]);
  }, []);

  useEffect(() => {
    if (currentScenario && autoGenerateTopics) {
      generateTopicsFromScenario(currentScenario);
    }
  }, [currentScenario, autoGenerateTopics]);

  const generateTopicsFromScenario = (scenario) => {
    const topics = [];
    
    for (let i = 0; i < scenario.topics; i++) {
      let topicConfig = {
        id: i,
        name: `Тема ${i + 1} (${scenario.name})`,
        type: 'scenario-generated',
        targetCluster: null,
        proximityLevel: 0.5,
        customVector: null
      };

      // Настройка тем в зависимости от типа сценария
      switch (scenario.proximitySettings.type) {
        case 'convergent':
          topicConfig.type = 'cluster-aligned';
          topicConfig.targetCluster = 0; // Все к одному кластеру
          topicConfig.proximityLevel = scenario.proximitySettings.strength;
          break;
          
        case 'divergent':
          topicConfig.type = 'cluster-aligned';
          topicConfig.targetCluster = i % simulationParams.numClusters;
          topicConfig.proximityLevel = scenario.proximitySettings.strength;
          break;
          
        case 'cluster_isolated':
          topicConfig.type = 'cluster-aligned';
          topicConfig.targetCluster = Math.floor(i / Math.ceil(scenario.topics / simulationParams.numClusters));
          topicConfig.proximityLevel = scenario.proximitySettings.strength;
          break;
          
        case 'cascade':
          topicConfig.type = 'random';
          topicConfig.proximityLevel = scenario.proximitySettings.strength * (1 - i / scenario.topics);
          break;
      }

      topics.push(topicConfig);
    }

    setTopicSettings(prev => ({
      ...prev,
      numTopics: scenario.topics,
      topics: topics
    }));

    // Генерация мнений
    generateOpinionsFromScenario(scenario);
  };

  const generateOpinionsFromScenario = (scenario) => {
    const opinions = {};
    
    for (let cluster = 0; cluster < simulationParams.numClusters; cluster++) {
      opinions[cluster] = [];
      
      for (let topic = 0; topic < scenario.topics; topic++) {
        let opinion = 0;
        
        switch (scenario.opinionDistribution) {
          case 'normal':
            opinion = (Math.random() - 0.5) * 0.4; // Нейтральные мнения
            break;
            
          case 'bimodal':
            opinion = Math.random() > 0.5 ? 0.7 : -0.7; // Поляризованные
            break;
            
          case 'cluster_based':
            opinion = (cluster / (simulationParams.numClusters - 1)) * 2 - 1; // От -1 до 1
            break;
            
          case 'random':
            opinion = Math.random() * 2 - 1; // Случайные
            break;
        }
        
        opinions[cluster].push(opinion);
      }
    }

    setOpinionSettings(prev => ({
      ...prev,
      clusterOpinions: opinions
    }));
  };

  const createNewScenario = () => {
    const newScenario = {
      id: `custom_${Date.now()}`,
      name: 'Новый сценарий',
      description: 'Описание сценария',
      topics: topicSettings.numTopics,
      proximitySettings: {
        type: 'random',
        strength: 0.5
      },
      opinionDistribution: 'normal',
      customLogic: '',
      isCustom: true
    };

    setEditingScenario(newScenario);
  };

  const saveScenario = () => {
    if (!editingScenario) return;

    const updatedScenarios = editingScenario.isNew 
      ? [...scenarios, editingScenario]
      : scenarios.map(s => s.id === editingScenario.id ? editingScenario : s);

    setScenarios(updatedScenarios);
    setCurrentScenario(editingScenario);
    setEditingScenario(null);
  };

  const deleteScenario = (scenarioId) => {
    if (presetScenarios.find(s => s.id === scenarioId)) {
      onError('Нельзя удалить предустановленный сценарий');
      return;
    }

    const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
    setScenarios(updatedScenarios);
    
    if (currentScenario?.id === scenarioId) {
      setCurrentScenario(presetScenarios[0]);
    }
  };

  const exportScenario = (scenario) => {
    const exportData = {
      scenario,
      topicSettings,
      opinionSettings,
      simulationParams: {
        vectorDimension: simulationParams.vectorDimension,
        numClusters: simulationParams.numClusters
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario_${scenario.name.replace(/\\s+/g, '_')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const importScenario = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        // Security: strip any executable `customLogic` from imported files.
        // Scenario JSON is untrusted input, and `customLogic` is passed to
        // `new Function(...)` in `agentSimulation.js` -> arbitrary JS exec
        // in the user's browser (see generateTopics). Users who need custom
        // logic can paste it into the textarea themselves after import.
        const sanitizedScenario = { ...(importData.scenario || {}) };
        const hadCustomLogic = Boolean(sanitizedScenario.customLogic);
        delete sanitizedScenario.customLogic;

        const importedScenario = {
          ...sanitizedScenario,
          id: `imported_${Date.now()}`,
          isCustom: true
        };

        setScenarios(prev => [...prev, importedScenario]);
        setCurrentScenario(importedScenario);

        if (hadCustomLogic && onError) {
          onError(
            'Импортированный сценарий содержал поле customLogic — оно удалено ' +
            'из соображений безопасности (произвольное выполнение JavaScript). ' +
            'При необходимости добавьте логику вручную в редакторе.'
          );
        }

        if (importData.topicSettings) {
          setTopicSettings(importData.topicSettings);
        }
        if (importData.opinionSettings) {
          setOpinionSettings(importData.opinionSettings);
        }
        if (importData.simulationParams) {
          onParamsChange(importData.simulationParams);
        }

      } catch (error) {
        onError(`Ошибка импорта сценария: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleTopicChange = (topicIndex, field, value) => {
    const updatedTopics = [...topicSettings.topics];
    updatedTopics[topicIndex] = {
      ...updatedTopics[topicIndex],
      [field]: value
    };

    setTopicSettings(prev => ({
      ...prev,
      topics: updatedTopics
    }));
  };

  const handleOpinionChange = (cluster, topic, value) => {
    const updatedOpinions = { ...opinionSettings.clusterOpinions };
    if (!updatedOpinions[cluster]) {
      updatedOpinions[cluster] = [];
    }
    updatedOpinions[cluster][topic] = value;

    setOpinionSettings(prev => ({
      ...prev,
      clusterOpinions: updatedOpinions
    }));
  };

  const addTopic = () => {
    const newTopic = {
      id: topicSettings.topics.length,
      name: `Тема ${topicSettings.topics.length + 1}`,
      type: 'random',
      targetCluster: 0,
      proximityLevel: 0.5,
      customVector: null
    };

    setTopicSettings(prev => ({
      ...prev,
      numTopics: prev.numTopics + 1,
      topics: [...prev.topics, newTopic]
    }));

    // Добавляем мнения для новой темы
    const updatedOpinions = { ...opinionSettings.clusterOpinions };
    for (let cluster = 0; cluster < simulationParams.numClusters; cluster++) {
      if (!updatedOpinions[cluster]) {
        updatedOpinions[cluster] = [];
      }
      updatedOpinions[cluster].push(0);
    }

    setOpinionSettings(prev => ({
      ...prev,
      clusterOpinions: updatedOpinions
    }));
  };

  const removeTopic = (topicIndex) => {
    const updatedTopics = topicSettings.topics.filter((_, i) => i !== topicIndex);
    
    setTopicSettings(prev => ({
      ...prev,
      numTopics: prev.numTopics - 1,
      topics: updatedTopics.map((topic, i) => ({ ...topic, id: i }))
    }));

    // Удаляем мнения для темы
    const updatedOpinions = { ...opinionSettings.clusterOpinions };
    for (let cluster = 0; cluster < simulationParams.numClusters; cluster++) {
      if (updatedOpinions[cluster]) {
        updatedOpinions[cluster].splice(topicIndex, 1);
      }
    }

    setOpinionSettings(prev => ({
      ...prev,
      clusterOpinions: updatedOpinions
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Расширенное управление сценариями
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scenarios" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scenarios">Сценарии</TabsTrigger>
            <TabsTrigger value="topics">Темы</TabsTrigger>
            <TabsTrigger value="opinions">Мнения</TabsTrigger>
            <TabsTrigger value="vectorizer">Векторизация</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-generate">Автогенерация тем</Label>
                <Switch
                  id="auto-generate"
                  checked={autoGenerateTopics}
                  onCheckedChange={setAutoGenerateTopics}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createNewScenario} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Создать
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importScenario}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Импорт
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scenario) => (
                <Card 
                  key={scenario.id} 
                  className={`p-4 cursor-pointer transition-colors ${
                    currentScenario?.id === scenario.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setCurrentScenario(scenario)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{scenario.name}</h4>
                    <div className="flex gap-1">
                      {scenario.isCustom && (
                        <>
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingScenario(scenario);
                            }}
                            variant="outline" 
                            size="sm"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteScenario(scenario.id);
                            }}
                            variant="outline" 
                            size="sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          exportScenario(scenario);
                        }}
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline" size="sm">
                      {scenario.topics} тем
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {scenario.proximitySettings.type}
                    </Badge>
                    {scenario.isCustom && (
                      <Badge variant="secondary" size="sm">
                        Пользовательский
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {currentScenario && (
              <Card className="p-4 bg-blue-50">
                <h4 className="font-medium mb-2">Текущий сценарий: {currentScenario.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Описание:</strong>
                    <p>{currentScenario.description}</p>
                  </div>
                  <div>
                    <strong>Параметры:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>Тем: {currentScenario.topics}</li>
                      <li>Тип: {currentScenario.proximitySettings.type}</li>
                      <li>Сила: {currentScenario.proximitySettings.strength}</li>
                      <li>Распределение: {currentScenario.opinionDistribution}</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Настройка тем ({topicSettings.topics.length})</h4>
              <Button onClick={addTopic} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Добавить тему
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {topicSettings.topics.map((topic, index) => (
                <Card key={topic.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={topic.name}
                        onChange={(e) => handleTopicChange(index, 'name', e.target.value)}
                        placeholder="Название темы"
                      />
                    </div>
                    <Button 
                      onClick={() => removeTopic(index)}
                      variant="outline" 
                      size="sm"
                      className="ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Тип генерации</Label>
                      <Select 
                        value={topic.type}
                        onValueChange={(value) => handleTopicChange(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Случайный</SelectItem>
                          <SelectItem value="cluster-aligned">Привязан к кластеру</SelectItem>
                          <SelectItem value="custom">Пользовательский вектор</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {topic.type === 'cluster-aligned' && (
                      <div>
                        <Label>Целевой кластер</Label>
                        <Select 
                          value={topic.targetCluster?.toString() || '0'}
                          onValueChange={(value) => handleTopicChange(index, 'targetCluster', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: simulationParams.numClusters }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                Кластер {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label>Близость к ценностям: {topic.proximityLevel}</Label>
                      <Slider
                        value={[topic.proximityLevel]}
                        onValueChange={(value) => handleTopicChange(index, 'proximityLevel', value[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="opinions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Распределение мнений по кластерам</h4>
              <div className="text-sm text-gray-600">
                Значения от -1 (против) до +1 (за)
              </div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: simulationParams.numClusters }, (_, cluster) => (
                <Card key={cluster} className="p-4">
                  <h5 className="font-medium mb-3">Кластер {cluster + 1}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topicSettings.topics.map((topic, topicIndex) => (
                      <div key={topic.id} className="space-y-2">
                        <Label className="text-sm">{topic.name}</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-8">-1</span>
                          <Slider
                            value={[opinionSettings.clusterOpinions[cluster]?.[topicIndex] || 0]}
                            onValueChange={(value) => handleOpinionChange(cluster, topicIndex, value[0])}
                            min={-1}
                            max={1}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-xs w-8">+1</span>
                          <span className="text-xs w-12 text-right">
                            {(opinionSettings.clusterOpinions[cluster]?.[topicIndex] || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4">
              <h5 className="font-medium mb-3">Загрузка полной матрицы мнений</h5>
              <div className="space-y-2">
                <Label>Загрузить CSV файл с матрицей мнений (агенты × темы)</Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    // Здесь будет логика загрузки матрицы мнений
                    console.log('Загрузка матрицы мнений:', e.target.files[0]);
                  }}
                />
                <p className="text-sm text-gray-600">
                  Формат: строки - агенты, столбцы - темы, значения от -1 до +1
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="vectorizer" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Векторизация текста
              </h4>
              <Button 
                onClick={() => setShowTextVectorizer(!showTextVectorizer)}
                variant="outline"
              >
                <Zap className="h-4 w-4 mr-1" />
                {showTextVectorizer ? 'Скрыть' : 'Показать'} векторизатор
              </Button>
            </div>

            {showTextVectorizer && (
              <TextVectorizer
                vectorDimension={simulationParams.vectorDimension}
                onVectorGenerated={(vector, text) => {
                  // Добавляем сгенерированный вектор как новую тему
                  const newTopic = {
                    id: topicSettings.topics.length,
                    name: `Векторизованная тема: ${text.substring(0, 30)}...`,
                    type: 'custom',
                    targetCluster: null,
                    proximityLevel: 0.5,
                    customVector: vector
                  };

                  setTopicSettings(prev => ({
                    ...prev,
                    numTopics: prev.numTopics + 1,
                    topics: [...prev.topics, newTopic]
                  }));

                  // Добавляем нейтральные мнения для новой темы
                  const updatedOpinions = { ...opinionSettings.clusterOpinions };
                  for (let cluster = 0; cluster < simulationParams.numClusters; cluster++) {
                    if (!updatedOpinions[cluster]) {
                      updatedOpinions[cluster] = [];
                    }
                    updatedOpinions[cluster].push(0);
                  }

                  setOpinionSettings(prev => ({
                    ...prev,
                    clusterOpinions: updatedOpinions
                  }));
                }}
                onError={onError}
              />
            )}

            <Card className="p-4">
              <h5 className="font-medium mb-3">Поддерживаемые модели</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h6 className="font-medium text-sm">Встроенные модели:</h6>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• TF-IDF (быстрая)</li>
                    <li>• Word2Vec (средняя)</li>
                    <li>• Sentence Transformers (точная)</li>
                  </ul>
                </div>
                <div>
                  <h6 className="font-medium text-sm">Внешние API:</h6>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• OpenAI Embeddings</li>
                    <li>• Hugging Face</li>
                    <li>• Google Universal Sentence Encoder</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Модальное окно редактирования сценария */}
        {editingScenario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">
                {editingScenario.isNew ? 'Создание сценария' : 'Редактирование сценария'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scenario-name">Название</Label>
                  <Input
                    id="scenario-name"
                    value={editingScenario.name}
                    onChange={(e) => setEditingScenario({
                      ...editingScenario,
                      name: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="scenario-description">Описание</Label>
                  <Textarea
                    id="scenario-description"
                    value={editingScenario.description}
                    onChange={(e) => setEditingScenario({
                      ...editingScenario,
                      description: e.target.value
                    })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Количество тем</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={editingScenario.topics}
                      onChange={(e) => setEditingScenario({
                        ...editingScenario,
                        topics: parseInt(e.target.value)
                      })}
                    />
                  </div>

                  <div>
                    <Label>Тип близости</Label>
                    <Select 
                      value={editingScenario.proximitySettings.type}
                      onValueChange={(value) => setEditingScenario({
                        ...editingScenario,
                        proximitySettings: {
                          ...editingScenario.proximitySettings,
                          type: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="convergent">Конвергентный</SelectItem>
                        <SelectItem value="divergent">Дивергентный</SelectItem>
                        <SelectItem value="cluster_isolated">Изолированные кластеры</SelectItem>
                        <SelectItem value="cascade">Каскадный</SelectItem>
                        <SelectItem value="random">Случайный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Пользовательская логика (JavaScript)</Label>
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2 my-1">
                    <strong>Внимание:</strong> этот код выполняется в вашем
                    браузере через <code>new Function</code>. Вставляйте только
                    код, которому доверяете — он получает доступ к DOM, cookie,
                    <code> localStorage</code> (включая сохранённые API-ключи)
                    и может отправлять запросы от вашего имени.
                  </div>
                  <Textarea
                    value={editingScenario.customLogic || ''}
                    onChange={(e) => setEditingScenario({
                      ...editingScenario,
                      customLogic: e.target.value
                    })}
                    rows={6}
                    placeholder="// Функция должна возвращать массив векторов тем\n// Доступные параметры: agents, clusterCenters, vectorDimension, numClusters\nreturn topics;"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={() => setEditingScenario(null)} 
                    variant="outline"
                  >
                    Отмена
                  </Button>
                  <Button onClick={saveScenario}>
                    <Save className="h-4 w-4 mr-1" />
                    Сохранить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedScenarioManager;
