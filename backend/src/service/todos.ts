import * as UUID from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { TodosAccess } from '../repository/todosAccess'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todosAccess = new TodosAccess()

export async function getAllTodos(): Promise<TodoItem[]> {
    return todosAccess.getAllTodos()
}

export async function getAllTodosForUser(userId: string): Promise<TodoItem[]> {
    return todosAccess.getAllTodosForUser(userId)
}

export async function updateTodo(
    todoId: string,
    userId: string,
    updateTodoRequest: UpdateTodoRequest
): Promise<void> {

    await todosAccess.validateUserOwnsTodo(todoId, userId)

    await todosAccess.updateTodo(
        todoId,
        updateTodoRequest.name,
        updateTodoRequest.dueDate,
        updateTodoRequest.done
    )
}

export async function createTodo(
    createTodoRequest: CreateTodoRequest, 
    userId: string
): Promise<TodoItem> {

    const todoId = UUID.v4()

    return await todosAccess.createTodoItem({
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false
    })
}

export async function deleteTodo(
    todoId: string,
    userId: string
): Promise<void> {
    
    await todosAccess.validateUserOwnsTodo(todoId, userId)
    
    await todosAccess.deleteTodo(todoId)
}

export async function addAttachmentUrl(
    todoId: string,
    userId: string
): Promise<void> {

    await todosAccess.validateUserOwnsTodo(todoId, userId)

    await todosAccess.addAttachmentUrl(todoId)
}