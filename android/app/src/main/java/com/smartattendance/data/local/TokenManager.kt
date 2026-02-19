package com.smartattendance.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.smartattendance.util.Constants
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = Constants.DATASTORE_NAME)

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        val JWT_TOKEN = stringPreferencesKey(Constants.KEY_JWT_TOKEN)
        val USER_NAME = stringPreferencesKey(Constants.KEY_USER_NAME)
        val USER_EMAIL = stringPreferencesKey(Constants.KEY_USER_EMAIL)
        val USER_ROLE = stringPreferencesKey(Constants.KEY_USER_ROLE)
        val USER_AVATAR = stringPreferencesKey(Constants.KEY_USER_AVATAR)
        val USER_ID = longPreferencesKey(Constants.KEY_USER_ID)
        val DARK_MODE = booleanPreferencesKey(Constants.KEY_DARK_MODE)
    }

    val token: Flow<String?> = context.dataStore.data.map { it[JWT_TOKEN] }
    val userName: Flow<String?> = context.dataStore.data.map { it[USER_NAME] }
    val userEmail: Flow<String?> = context.dataStore.data.map { it[USER_EMAIL] }
    val userRole: Flow<String?> = context.dataStore.data.map { it[USER_ROLE] }
    val userAvatar: Flow<String?> = context.dataStore.data.map { it[USER_AVATAR] }
    val userId: Flow<Long?> = context.dataStore.data.map { it[USER_ID] }
    val darkMode: Flow<Boolean> = context.dataStore.data.map { it[DARK_MODE] ?: false }

    val isLoggedIn: Flow<Boolean> = context.dataStore.data.map { it[JWT_TOKEN] != null }

    suspend fun getToken(): String? = context.dataStore.data.first()[JWT_TOKEN]

    suspend fun saveAuthData(
        token: String,
        userId: Long,
        name: String,
        email: String,
        role: String,
        avatarUrl: String?
    ) {
        context.dataStore.edit { prefs ->
            prefs[JWT_TOKEN] = token
            prefs[USER_ID] = userId
            prefs[USER_NAME] = name
            prefs[USER_EMAIL] = email
            prefs[USER_ROLE] = role
            avatarUrl?.let { prefs[USER_AVATAR] = it }
        }
    }

    suspend fun setDarkMode(enabled: Boolean) {
        context.dataStore.edit { it[DARK_MODE] = enabled }
    }

    suspend fun clearAll() {
        context.dataStore.edit { it.clear() }
    }
}
