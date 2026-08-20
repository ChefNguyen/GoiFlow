@echo off
set MAVEN_PROJECTBASEDIR=%~dp0
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

if not "%JAVA_HOME%"=="" (
  set MVNW_JAVACMD="%JAVA_HOME%\bin\java.exe"
) else (
  set MVNW_JAVACMD=java
)

%MVNW_JAVACMD% "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" -classpath ".mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain %*
