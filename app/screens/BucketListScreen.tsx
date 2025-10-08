import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../../stores/ThemeStore';
import {BackendService} from '../../services/BackendService';

interface BucketListItem {
  title: string;
  description: string;
  priority_number: number;
}

interface Props {
  onBack: () => void;
  backendUser: any;
}

export default function BucketListScreen({onBack, backendUser}: Props) {
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add');
  const [bucketList, setBucketList] = useState<BucketListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Add form state
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragPosition] = useState(new Animated.ValueXY());
  const [isDragging, setIsDragging] = useState(false);

  const loadBucketList = useCallback(async () => {
    if (!backendUser?.user_id) return;

    try {
      setLoading(true);
      const response = await BackendService.getBucketList(backendUser.user_id);
      if (response.success && response.bucketList) {
        setBucketList(response.bucketList);
      }
    } catch (error) {
      console.error('Error loading bucket list:', error);
      Alert.alert('Error', 'Failed to load bucket list');
    } finally {
      setLoading(false);
    }
  }, [backendUser?.user_id]);

  // Load bucket list on component mount
  useEffect(() => {
    loadBucketList();
  }, [loadBucketList]);

  const addBucketListItem = async () => {
    if (!newItemTitle.trim()) {
      Alert.alert('Error', 'Please enter a bucket list item title');
      return;
    }

    if (!backendUser?.user_id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      setSaving(true);

      const response = await BackendService.addBucketListItem(
        backendUser.user_id,
        newItemTitle.trim(),
        newItemDescription.trim(),
      );

      if (response.success) {
        setBucketList(response.bucketList);
        setNewItemTitle('');
        setNewItemDescription('');
        Alert.alert('Success', 'Bucket list item added successfully!');
      } else {
        Alert.alert('Error', 'Failed to add bucket list item');
      }
    } catch (error) {
      console.error('Error adding bucket list item:', error);
      Alert.alert('Error', 'Failed to add bucket list item');
    } finally {
      setSaving(false);
    }
  };

  const startEditItem = (index: number) => {
    setEditingIndex(index);
    setEditTitle(bucketList[index].title);
    setEditDescription(bucketList[index].description);
  };

  const saveEditItem = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Please enter a valid title');
      return;
    }

    if (!backendUser?.user_id || editingIndex === null) return;

    try {
      setSaving(true);
      const updatedList = [...bucketList];
      updatedList[editingIndex] = {
        ...updatedList[editingIndex],
        title: editTitle.trim(),
        description: editDescription.trim(),
      };

      const response = await BackendService.updateBucketList(
        backendUser.user_id,
        updatedList,
      );

      if (response.success) {
        setBucketList(updatedList);
        setEditingIndex(null);
        setEditTitle('');
        setEditDescription('');
        Alert.alert('Success', 'Bucket list item updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update bucket list item');
      }
    } catch (error) {
      console.error('Error updating bucket list item:', error);
      Alert.alert('Error', 'Failed to update bucket list item');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditTitle('');
    setEditDescription('');
  };

  const deleteBucketListItem = async (index: number) => {
    if (!backendUser?.user_id) return;

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this bucket list item?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedList = bucketList.filter((_, i) => i !== index);
              // Update priority numbers after deletion
              const reorderedList = updatedList.map((item, idx) => ({
                ...item,
                priority_number: idx + 1,
              }));

              const response = await BackendService.updateBucketList(
                backendUser.user_id,
                reorderedList,
              );

              if (response.success) {
                setBucketList(reorderedList);
                Alert.alert(
                  'Success',
                  'Bucket list item deleted successfully!',
                );
              } else {
                Alert.alert('Error', 'Failed to delete bucket list item');
              }
            } catch (error) {
              console.error('Error deleting bucket list item:', error);
              Alert.alert('Error', 'Failed to delete bucket list item');
            }
          },
        },
      ],
    );
  };

  // Drag and drop reordering
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newList = [...bucketList];
    const [movedItem] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, movedItem);

    // Update priority numbers based on new order
    const reorderedList = newList.map((item, index) => ({
      ...item,
      priority_number: index + 1,
    }));

    setBucketList(reorderedList);
  };

  const saveReorder = async () => {
    if (!backendUser?.user_id) return;

    try {
      setSaving(true);
      const response = await BackendService.reorderBucketList(
        backendUser.user_id,
        bucketList,
      );

      if (response.success) {
        Alert.alert('Success', 'Bucket list reordered successfully!');
      } else {
        Alert.alert('Error', 'Failed to reorder bucket list');
      }
    } catch (error) {
      console.error('Error reordering bucket list:', error);
      Alert.alert('Error', 'Failed to reorder bucket list');
    } finally {
      setSaving(false);
    }
  };

  // Drag and drop handlers
  const createPanResponder = (index: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDraggedIndex(index);
        setIsDragging(true);
        dragPosition.setOffset({
          x: (dragPosition.x as any)._value,
          y: (dragPosition.y as any)._value,
        });
        dragPosition.setValue({x: 0, y: 0});
      },
      onPanResponderMove: (evt, gestureState) => {
        dragPosition.setValue({x: gestureState.dx, y: gestureState.dy});
      },
      onPanResponderRelease: (evt, gestureState) => {
        dragPosition.flattenOffset();

        // Calculate which item we're hovering over based on the final position
        const itemHeight = 100; // Approximate height of each item including margin
        const scrollOffset = 0; // We're not using ScrollView offset for now
        const finalY = gestureState.moveY + scrollOffset;
        const newIndex = Math.round(finalY / itemHeight);
        const clampedIndex = Math.max(
          0,
          Math.min(newIndex, bucketList.length - 1),
        );

        if (draggedIndex !== null && clampedIndex !== draggedIndex) {
          moveItem(draggedIndex, clampedIndex);
        }

        // Reset drag state
        setDraggedIndex(null);
        setIsDragging(false);
        dragPosition.setValue({x: 0, y: 0});
      },
    });
  };

  const totalCount = bucketList.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.background, theme.surface, theme.surfaceVariant]}
        style={styles.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bucket List</Text>
          <View style={styles.headerStats}>
            <Text style={styles.statsText}>{totalCount} items</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'add' && styles.activeTab]}
            onPress={() => setActiveTab('add')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'add' && styles.activeTabText,
              ]}>
              Add Item
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'view' && styles.activeTab]}
            onPress={() => setActiveTab('view')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'view' && styles.activeTabText,
              ]}>
              View List
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'add' ? (
            <ScrollView style={styles.addTabContent}>
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Add New Bucket List Item</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Title *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newItemTitle}
                    onChangeText={setNewItemTitle}
                    placeholder="Enter bucket list item title..."
                    placeholderTextColor={theme.textTertiary}
                    maxLength={100}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={newItemDescription}
                    onChangeText={setNewItemDescription}
                    placeholder="Add a description..."
                    placeholderTextColor={theme.textTertiary}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.addButton, saving && styles.addButtonDisabled]}
                  onPress={addBucketListItem}
                  disabled={saving}>
                  <LinearGradient
                    colors={
                      saving
                        ? [theme.textTertiary, theme.textTertiary]
                        : [theme.primary, theme.accent]
                    }
                    style={styles.addButtonGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.addButtonText}>
                        Add to Bucket List
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.viewTabContent}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={styles.loadingText}>Loading bucket list...</Text>
                </View>
              ) : bucketList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={styles.emptyTitle}>
                    No Bucket List Items Yet
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Start adding your dreams and goals to your bucket list!
                  </Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {bucketList.length > 1 && (
                    <View style={styles.reorderHeader}>
                      <Text style={styles.reorderText}>
                        Long press and drag items to reorder (priority based on
                        position)
                      </Text>
                      <TouchableOpacity
                        style={styles.saveReorderButton}
                        onPress={saveReorder}
                        disabled={saving}>
                        <Text style={styles.saveReorderButtonText}>
                          {saving ? 'Saving...' : 'Save Order'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {bucketList.map((item, index) => {
                    const panResponder = createPanResponder(index);
                    const isDraggedItem = draggedIndex === index;

                    return (
                      <Animated.View
                        key={`${item.priority_number}-${index}`}
                        style={[
                          styles.listItem,
                          isDraggedItem && styles.draggedItem,
                          isDragging &&
                            isDraggedItem && [
                              {
                                transform: [
                                  {translateX: dragPosition.x},
                                  {translateY: dragPosition.y},
                                ],
                              },
                              styles.draggingItem,
                            ],
                        ]}
                        {...panResponder.panHandlers}>
                        {editingIndex === index ? (
                          <View style={styles.editContainer}>
                            <View style={styles.editInputs}>
                              <TextInput
                                style={styles.editInput}
                                value={editTitle}
                                onChangeText={setEditTitle}
                                placeholder="Edit title..."
                                placeholderTextColor={theme.textTertiary}
                                autoFocus
                              />
                              <TextInput
                                style={[styles.editInput, styles.editTextArea]}
                                value={editDescription}
                                onChangeText={setEditDescription}
                                placeholder="Edit description..."
                                placeholderTextColor={theme.textTertiary}
                                multiline
                                numberOfLines={2}
                              />
                            </View>
                            <View style={styles.editButtons}>
                              <TouchableOpacity
                                style={styles.saveButton}
                                onPress={saveEditItem}
                                disabled={saving}>
                                <Text style={styles.saveButtonText}>Save</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={cancelEdit}>
                                <Text style={styles.cancelButtonText}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <>
                            <View style={styles.itemContent}>
                              <View style={styles.itemHeader}>
                                <Text style={styles.priorityNumber}>
                                  #{item.priority_number}
                                </Text>
                                <Text style={styles.itemTitle}>
                                  {item.title}
                                </Text>
                              </View>
                              {item.description && (
                                <Text style={styles.itemDescription}>
                                  {item.description}
                                </Text>
                              )}
                            </View>
                            <View style={styles.actionButtons}>
                              <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => startEditItem(index)}>
                                <Text style={styles.editButtonText}>✏️</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => deleteBucketListItem(index)}>
                                <Text style={styles.deleteButtonText}>🗑️</Text>
                              </TouchableOpacity>
                              <View style={styles.dragHandle}>
                                <Text style={styles.dragHandleText}>⋮⋮</Text>
                              </View>
                            </View>
                          </>
                        )}
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerStats: {
    padding: 8,
  },
  statsText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addTabContent: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  addButton: {
    borderRadius: 12,
    marginTop: 8,
    shadowColor: theme.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    shadowOpacity: 0.1,
  },
  addButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  viewTabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  listItem: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  editContainer: {
    flex: 1,
  },
  editInput: {
    backgroundColor: theme.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.borderLight,
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: theme.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  reorderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reorderText: {
    fontSize: 12,
    color: theme.textSecondary,
    flex: 1,
  },
  saveReorderButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveReorderButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
    marginRight: 8,
    minWidth: 20,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  editInputs: {
    flex: 1,
  },
  editTextArea: {
    height: 60,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  dragHandle: {
    padding: 8,
    marginLeft: 4,
    backgroundColor: theme.surfaceVariant,
    borderRadius: 4,
  },
  dragHandleText: {
    fontSize: 16,
    color: theme.textTertiary,
    fontWeight: 'bold',
  },
  draggedItem: {
    opacity: 0.8,
    shadowColor: theme.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  draggingItem: {
    zIndex: 1000,
    elevation: 1000,
  },
});
